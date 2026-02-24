from __future__ import annotations

from datetime import datetime, timezone

from app.domain.schemas import CityRankingItem, QrBindIn, UserLocation, UserLocationCreate
from app.infrastructure.firebase_admin import get_firestore_client
from app.infrastructure.stores.memory_store import make_qr_hash, store

try:
    from firebase_admin import firestore
except Exception:  # pragma: no cover
    firestore = None


class NightRepository:
    def __init__(self) -> None:
        self.db = get_firestore_client()

    @property
    def using_firestore(self) -> bool:
        return self.db is not None

    def list_locations(self) -> list[UserLocation]:
        if not self.using_firestore:
            return store.locations

        docs = (
            self.db.collection('locations')
            .order_by('created_at', direction=firestore.Query.DESCENDING)
            .limit(2000)
            .stream()
        )

        result: list[UserLocation] = []
        for doc in docs:
            raw = doc.to_dict() or {}
            created_at = raw.get('created_at')
            if not isinstance(created_at, datetime):
                created_at = datetime.now(timezone.utc)

            result.append(
                UserLocation(
                    id=str(raw.get('id', doc.id)),
                    uid=str(raw.get('uid', 'unknown')),
                    name=str(raw.get('name', 'User')),
                    city=str(raw.get('city', 'Unknown')),
                    country=str(raw.get('country', 'Unknown')),
                    lat=float(raw.get('lat', 0.0)),
                    lng=float(raw.get('lng', 0.0)),
                    created_at=created_at,
                )
            )

        return result

    def create_location(self, payload: UserLocationCreate) -> UserLocation:
        location = UserLocation(
            id=f'loc-{int(datetime.now(timezone.utc).timestamp() * 1000)}',
            uid=payload.uid,
            name=payload.name,
            city=payload.city,
            country=payload.country,
            lat=payload.lat,
            lng=payload.lng,
            created_at=datetime.now(timezone.utc),
        )

        if not self.using_firestore:
            store.locations.insert(0, location)
            return location

        self.db.collection('locations').document(location.id).set(location.model_dump())
        return location

    def list_city_ranking(self) -> list[CityRankingItem]:
        if not self.using_firestore:
            return sorted(store.city_ranking, key=lambda row: row.count_items, reverse=True)[:10]

        docs = (
            self.db.collection('city_rankings')
            .order_by('count_items', direction=firestore.Query.DESCENDING)
            .limit(10)
            .stream()
        )

        result: list[CityRankingItem] = []
        for doc in docs:
            raw = doc.to_dict() or {}
            updated_at = raw.get('updated_at')
            if not isinstance(updated_at, datetime):
                updated_at = datetime.now(timezone.utc)

            result.append(
                CityRankingItem(
                    city=str(raw.get('city', doc.id)),
                    country=str(raw.get('country', 'Unknown')),
                    count_items=int(raw.get('count_items', 0)),
                    updated_at=updated_at,
                )
            )

        return result

    def bind_qr(self, payload: QrBindIn) -> tuple[bool, str, str | None]:
        qr_id = payload.qr_id.strip().upper()
        if not qr_id.startswith('NM-'):
            return False, 'QR format invalid', None

        secure_hash = make_qr_hash(qr_id)

        if not self.using_firestore:
            if qr_id in store.bound_qr:
                return False, 'Этот QR уже привязан к другому профилю', None

            store.bound_qr[qr_id] = {
                'owner_uid': payload.uid,
                'item_name': payload.item_name,
                'city': payload.city,
                'secure_hash': secure_hash,
            }
            return True, 'QR успешно привязан к профилю', secure_hash

        qr_ref = self.db.collection('qr_codes').document(qr_id)
        qr_snapshot = qr_ref.get()

        if qr_snapshot.exists:
            qr_raw = qr_snapshot.to_dict() or {}
            if qr_raw.get('status') == 'bound':
                return False, 'Этот QR уже привязан к другому профилю', None

        now = datetime.now(timezone.utc)

        qr_ref.set(
            {
                'owner_uid': payload.uid,
                'item_details': {
                    'item_name': payload.item_name,
                    'city': payload.city,
                    'qr_id': qr_id,
                },
                'status': 'bound',
                'secure_hash': secure_hash,
                'bound_at': now,
            },
            merge=True,
        )

        self.db.collection('users').document(payload.uid).collection('items').document(qr_id).set(
            {
                'qr_id': qr_id,
                'item_name': payload.item_name,
                'status': 'bound',
                'bound_at': now,
            },
            merge=True,
        )

        ranking_ref = self.db.collection('city_rankings').document(payload.city.lower())
        ranking_ref.set(
            {
                'city': payload.city,
                'country': 'Unknown',
                'count_items': firestore.Increment(1),
                'updated_at': now,
            },
            merge=True,
        )

        return True, 'QR успешно привязан к профилю', secure_hash
