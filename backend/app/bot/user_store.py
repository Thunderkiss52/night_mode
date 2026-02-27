from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.infrastructure.firebase_admin import get_firestore_client

try:
    from firebase_admin import firestore
except Exception:  # pragma: no cover
    firestore = None


class TelegramUserStore:
    def __init__(self) -> None:
        self.db = get_firestore_client()
        self._memory_users: dict[int, dict[str, Any]] = {}

    @property
    def using_firestore(self) -> bool:
        return self.db is not None and firestore is not None

    def upsert_user(
        self,
        user_id: int,
        username: str | None,
        first_name: str | None,
        last_name: str | None,
    ) -> None:
        now = datetime.now(timezone.utc)

        if not self.using_firestore:
            current = self._memory_users.get(user_id, {})
            current.update(
                {
                    'user_id': user_id,
                    'username': username,
                    'first_name': first_name or '',
                    'last_name': last_name or '',
                    'last_seen_at': now,
                }
            )
            current.setdefault('created_at', now)
            current.setdefault('referrals', 0)
            current.setdefault('referred_by', None)
            self._memory_users[user_id] = current
            return

        ref = self.db.collection('tg_users').document(str(user_id))
        snapshot = ref.get()
        payload: dict[str, Any] = {
            'user_id': user_id,
            'username': username,
            'first_name': first_name or '',
            'last_name': last_name or '',
            'last_seen_at': now,
        }
        if not snapshot.exists:
            payload['created_at'] = now
            payload['referrals'] = 0
            payload['referred_by'] = None

        ref.set(
            payload,
            merge=True,
        )

    def apply_referral(self, user_id: int, referrer_id: int) -> bool:
        if user_id == referrer_id:
            return False

        now = datetime.now(timezone.utc)

        if not self.using_firestore:
            user = self._memory_users.setdefault(
                user_id,
                {
                    'user_id': user_id,
                    'created_at': now,
                    'last_seen_at': now,
                    'referrals': 0,
                    'referred_by': None,
                },
            )
            if user.get('referred_by') is not None:
                return False

            user['referred_by'] = referrer_id
            referrer = self._memory_users.setdefault(
                referrer_id,
                {
                    'user_id': referrer_id,
                    'created_at': now,
                    'last_seen_at': now,
                    'referrals': 0,
                    'referred_by': None,
                },
            )
            referrer['referrals'] = int(referrer.get('referrals', 0)) + 1
            return True

        users = self.db.collection('tg_users')
        user_ref = users.document(str(user_id))
        user_snapshot = user_ref.get()
        user_data = user_snapshot.to_dict() if user_snapshot.exists else {}
        if user_data.get('referred_by') is not None:
            return False

        user_ref.set(
            {
                'user_id': user_id,
                'referred_by': referrer_id,
                'updated_at': now,
            },
            merge=True,
        )

        referrer_ref = users.document(str(referrer_id))
        referrer_ref.set(
            {
                'user_id': referrer_id,
                'referrals': firestore.Increment(1),
                'updated_at': now,
            },
            merge=True,
        )
        return True

    def get_referral_count(self, user_id: int) -> int:
        if not self.using_firestore:
            return int(self._memory_users.get(user_id, {}).get('referrals', 0))

        snapshot = self.db.collection('tg_users').document(str(user_id)).get()
        if not snapshot.exists:
            return 0

        raw = snapshot.to_dict() or {}
        return int(raw.get('referrals', 0))
