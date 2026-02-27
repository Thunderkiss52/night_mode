from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.geocoder import ReverseGeocoder
from app.domain.schemas import (
    CityRankingItem,
    ClickerLeaderboardItem,
    ClickerLotteryEntry,
    ClickerState,
    QrBindIn,
    UserLocation,
    UserLocationCreate,
)
from app.infrastructure.firebase_admin import get_firestore_client
from app.infrastructure.stores.memory_store import make_qr_hash, store

try:
    from firebase_admin import firestore
except Exception:  # pragma: no cover
    firestore = None


class NightRepository:
    _PLACEHOLDER_VALUES = {
        '',
        'unknown',
        'custom point',
        'custom',
        'n/a',
        'none',
        'null',
    }

    def __init__(self) -> None:
        self.db = get_firestore_client()
        self.geocoder = ReverseGeocoder(settings=settings)
        self._clicker_users: dict[str, dict] = {}
        self._lottery_entries: dict[str, dict] = {}

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
        city, country = self._resolve_location_details(payload)
        location = UserLocation(
            id=f'loc-{int(datetime.now(timezone.utc).timestamp() * 1000)}',
            uid=payload.uid,
            name=payload.name,
            city=city,
            country=country,
            lat=payload.lat,
            lng=payload.lng,
            created_at=datetime.now(timezone.utc),
        )

        if not self.using_firestore:
            store.locations.insert(0, location)
            return location

        self.db.collection('locations').document(location.id).set(location.model_dump())
        return location

    def _resolve_location_details(self, payload: UserLocationCreate) -> tuple[str, str]:
        city = payload.city.strip() if isinstance(payload.city, str) else ''
        country = payload.country.strip() if isinstance(payload.country, str) else ''

        if not self._is_placeholder(city) and not self._is_placeholder(country):
            return city, country

        geocoded = self.geocoder.reverse(payload.lat, payload.lng)
        if not geocoded:
            return city or 'Unknown', country or 'Unknown'

        resolved_city = geocoded.city if self._is_placeholder(city) and geocoded.city else city
        resolved_country = geocoded.country if self._is_placeholder(country) and geocoded.country else country
        return resolved_city or 'Unknown', resolved_country or 'Unknown'

    @classmethod
    def _is_placeholder(cls, value: str) -> bool:
        return value.strip().lower() in cls._PLACEHOLDER_VALUES

    @staticmethod
    def build_clicker_uid(telegram_user_id: int) -> str:
        return f'tg:{telegram_user_id}'

    @staticmethod
    def _telegram_id_from_uid(uid: str) -> int | None:
        if not uid.startswith('tg:'):
            return None
        candidate = uid[3:]
        if not candidate.isdigit():
            return None
        return int(candidate)

    @staticmethod
    def _safe_datetime(value: object) -> datetime | None:
        if isinstance(value, datetime):
            return value
        return None

    @staticmethod
    def _points_for_level(level: int) -> int:
        normalized_level = max(1, level)
        if normalized_level <= 30:
            return (normalized_level - 1) * 10_000
        return 290_000 + (normalized_level - 30) * 100_000

    @classmethod
    def _level_from_points(cls, points: int) -> int:
        normalized_points = max(0, points)
        if normalized_points < 290_000:
            return normalized_points // 10_000 + 1
        return 30 + (normalized_points - 290_000) // 100_000

    @classmethod
    def _next_level_points(cls, level: int) -> int | None:
        if level < 1:
            return cls._points_for_level(2)
        return cls._points_for_level(level + 1)

    @staticmethod
    def _display_name(
        uid: str,
        first_name: str | None,
        last_name: str | None,
        username: str | None,
    ) -> str:
        full_name = ' '.join(part for part in [first_name or '', last_name or ''] if part.strip()).strip()
        if full_name:
            return full_name
        if username:
            return f'@{username.lstrip("@")}'
        return uid

    def _base_clicker_user(
        self,
        uid: str,
        now: datetime,
        telegram_user_id: int | None = None,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> dict:
        return {
            'uid': uid,
            'telegram_user_id': telegram_user_id,
            'username': username or None,
            'first_name': first_name or '',
            'last_name': last_name or '',
            'display_name': self._display_name(uid, first_name, last_name, username),
            'points': 0,
            'level': 1,
            'multiplier': 1,
            'referrals': 0,
            'referred_by': None,
            'daily_bonus_claimed_at': None,
            'lottery_joined': False,
            'lottery_entered_at': None,
            'night_mode_unlocked': False,
            'last_tap_second': 0,
            'taps_in_second': 0,
            'created_at': now,
            'updated_at': now,
        }

    def _normalize_clicker_record(
        self,
        raw: dict,
        uid: str,
        now: datetime,
    ) -> dict:
        telegram_user_id = raw.get('telegram_user_id')
        if not isinstance(telegram_user_id, int):
            telegram_user_id = self._telegram_id_from_uid(uid)

        first_name = raw.get('first_name') if isinstance(raw.get('first_name'), str) else ''
        last_name = raw.get('last_name') if isinstance(raw.get('last_name'), str) else ''
        username = raw.get('username') if isinstance(raw.get('username'), str) else None
        points = int(raw.get('points', 0))
        level = self._level_from_points(points)
        referrals = int(raw.get('referrals', 0))
        referred_by = raw.get('referred_by')
        if not isinstance(referred_by, int):
            referred_by = None

        created_at = self._safe_datetime(raw.get('created_at')) or now
        updated_at = self._safe_datetime(raw.get('updated_at')) or now
        daily_bonus_claimed_at = self._safe_datetime(raw.get('daily_bonus_claimed_at'))
        lottery_entered_at = self._safe_datetime(raw.get('lottery_entered_at'))

        record = {
            'uid': uid,
            'telegram_user_id': telegram_user_id,
            'username': username,
            'first_name': first_name,
            'last_name': last_name,
            'display_name': self._display_name(uid, first_name, last_name, username),
            'points': max(0, points),
            'level': max(1, level),
            'multiplier': max(1, level),
            'referrals': max(0, referrals),
            'referred_by': referred_by,
            'daily_bonus_claimed_at': daily_bonus_claimed_at,
            'lottery_joined': bool(raw.get('lottery_joined', False)),
            'lottery_entered_at': lottery_entered_at,
            'night_mode_unlocked': bool(raw.get('night_mode_unlocked', False)),
            'last_tap_second': int(raw.get('last_tap_second', 0)),
            'taps_in_second': max(0, int(raw.get('taps_in_second', 0))),
            'created_at': created_at,
            'updated_at': updated_at,
        }
        return record

    def _serialize_clicker_record(self, record: dict) -> dict:
        return {
            'uid': record['uid'],
            'telegram_user_id': record.get('telegram_user_id'),
            'username': record.get('username'),
            'first_name': record.get('first_name', ''),
            'last_name': record.get('last_name', ''),
            'display_name': record.get('display_name', 'Player'),
            'points': int(record.get('points', 0)),
            'level': int(record.get('level', 1)),
            'multiplier': int(record.get('multiplier', 1)),
            'referrals': int(record.get('referrals', 0)),
            'referred_by': record.get('referred_by'),
            'daily_bonus_claimed_at': record.get('daily_bonus_claimed_at'),
            'lottery_joined': bool(record.get('lottery_joined', False)),
            'lottery_entered_at': record.get('lottery_entered_at'),
            'night_mode_unlocked': bool(record.get('night_mode_unlocked', False)),
            'last_tap_second': int(record.get('last_tap_second', 0)),
            'taps_in_second': int(record.get('taps_in_second', 0)),
            'created_at': record.get('created_at'),
            'updated_at': record.get('updated_at'),
        }

    def _save_clicker_record(self, record: dict) -> None:
        uid = str(record['uid'])
        if not self.using_firestore:
            self._clicker_users[uid] = record.copy()
            return

        payload = self._serialize_clicker_record(record)
        self.db.collection('users').document(uid).set(payload, merge=True)

    def _upsert_clicker_rating(self, record: dict) -> None:
        payload = {
            'uid': record['uid'],
            'telegram_user_id': record.get('telegram_user_id'),
            'display_name': record.get('display_name', 'Player'),
            'points': int(record.get('points', 0)),
            'level': int(record.get('level', 1)),
            'referrals': int(record.get('referrals', 0)),
            'updated_at': record.get('updated_at') or datetime.now(timezone.utc),
        }

        if not self.using_firestore:
            return

        self.db.collection('ratings').document(str(record['uid'])).set(payload, merge=True)

    def _fetch_clicker_record(self, uid: str, now: datetime) -> dict | None:
        if not self.using_firestore:
            raw = self._clicker_users.get(uid)
            if raw is None:
                return None
            return self._normalize_clicker_record(raw, uid=uid, now=now)

        snapshot = self.db.collection('users').document(uid).get()
        if not snapshot.exists:
            return None
        raw = snapshot.to_dict() or {}
        return self._normalize_clicker_record(raw, uid=uid, now=now)

    def _get_or_create_clicker_record(
        self,
        uid: str,
        now: datetime,
        telegram_user_id: int | None = None,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> dict:
        current = self._fetch_clicker_record(uid=uid, now=now)
        if current is None:
            created = self._base_clicker_user(
                uid=uid,
                now=now,
                telegram_user_id=telegram_user_id,
                username=username,
                first_name=first_name,
                last_name=last_name,
            )
            self._save_clicker_record(created)
            self._upsert_clicker_rating(created)
            return created

        changed = False
        if telegram_user_id is not None and current.get('telegram_user_id') != telegram_user_id:
            current['telegram_user_id'] = telegram_user_id
            changed = True
        if username is not None and current.get('username') != username:
            current['username'] = username
            changed = True
        if first_name is not None and current.get('first_name') != first_name:
            current['first_name'] = first_name
            changed = True
        if last_name is not None and current.get('last_name') != last_name:
            current['last_name'] = last_name
            changed = True

        if changed:
            current['display_name'] = self._display_name(
                uid,
                current.get('first_name'),
                current.get('last_name'),
                current.get('username'),
            )
            current['updated_at'] = now
            self._save_clicker_record(current)
            self._upsert_clicker_rating(current)

        return current

    def _to_clicker_state(self, record: dict, now: datetime) -> ClickerState:
        daily_claimed_at = self._safe_datetime(record.get('daily_bonus_claimed_at'))
        next_daily_bonus_at: datetime | None = None
        daily_bonus_available = True
        if daily_claimed_at is not None:
            next_daily_bonus_at = daily_claimed_at + timedelta(days=1)
            daily_bonus_available = now >= next_daily_bonus_at
            if daily_bonus_available:
                next_daily_bonus_at = None

        level = int(record.get('level', 1))
        return ClickerState(
            uid=str(record.get('uid', 'unknown')),
            telegram_user_id=record.get('telegram_user_id'),
            username=record.get('username'),
            display_name=str(record.get('display_name', 'Player')),
            points=max(0, int(record.get('points', 0))),
            level=max(1, level),
            multiplier=max(1, int(record.get('multiplier', level))),
            referrals=max(0, int(record.get('referrals', 0))),
            referred_by=record.get('referred_by'),
            daily_bonus_available=daily_bonus_available,
            daily_bonus_claimed_at=daily_claimed_at,
            next_daily_bonus_at=next_daily_bonus_at,
            lottery_joined=bool(record.get('lottery_joined', False)),
            lottery_entered_at=self._safe_datetime(record.get('lottery_entered_at')),
            night_mode_unlocked=bool(record.get('night_mode_unlocked', False)),
            taps_in_current_second=max(0, int(record.get('taps_in_second', 0))),
            level_start_points=self._points_for_level(level),
            next_level_points=self._next_level_points(level),
            updated_at=self._safe_datetime(record.get('updated_at')) or now,
        )

    def upsert_clicker_user(
        self,
        telegram_user_id: int,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> ClickerState:
        now = datetime.now(timezone.utc)
        uid = self.build_clicker_uid(telegram_user_id)
        record = self._get_or_create_clicker_record(
            uid=uid,
            now=now,
            telegram_user_id=telegram_user_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
        return self._to_clicker_state(record, now=now)

    def get_clicker_state(self, uid: str) -> ClickerState:
        now = datetime.now(timezone.utc)
        telegram_user_id = self._telegram_id_from_uid(uid)
        record = self._get_or_create_clicker_record(
            uid=uid,
            now=now,
            telegram_user_id=telegram_user_id,
        )
        return self._to_clicker_state(record, now=now)

    def tap_clicker(self, uid: str, taps: int) -> tuple[bool, int, int, int, bool, str, ClickerState]:
        now = datetime.now(timezone.utc)
        telegram_user_id = self._telegram_id_from_uid(uid)
        record = self._get_or_create_clicker_record(uid=uid, now=now, telegram_user_id=telegram_user_id)

        requested_taps = max(1, int(taps))
        current_second = int(now.timestamp())
        last_second = int(record.get('last_tap_second', 0))
        taps_used = int(record.get('taps_in_second', 0)) if last_second == current_second else 0
        max_taps = max(1, settings.clicker_max_taps_per_second)
        allowed_taps = max(0, max_taps - taps_used)
        accepted_taps = min(requested_taps, allowed_taps)
        rejected_taps = max(0, requested_taps - accepted_taps)
        throttled = accepted_taps == 0

        multiplier = max(1, int(record.get('multiplier', 1)))
        added_points = accepted_taps * multiplier
        if added_points > 0:
            record['points'] = int(record.get('points', 0)) + added_points
            new_level = self._level_from_points(int(record['points']))
            record['level'] = new_level
            record['multiplier'] = new_level
            record['night_mode_unlocked'] = True

        record['last_tap_second'] = current_second
        record['taps_in_second'] = taps_used + accepted_taps
        record['updated_at'] = now

        self._save_clicker_record(record)
        self._upsert_clicker_rating(record)

        if throttled:
            message = 'Tap limit reached. Max 10 taps/sec.'
        elif rejected_taps > 0:
            message = 'Part of taps were rejected by anti-cheat.'
        else:
            message = 'Tap accepted.'

        return (
            added_points > 0,
            accepted_taps,
            rejected_taps,
            added_points,
            throttled,
            message,
            self._to_clicker_state(record, now=now),
        )

    def claim_daily_bonus(self, uid: str) -> tuple[bool, int, str, ClickerState]:
        now = datetime.now(timezone.utc)
        telegram_user_id = self._telegram_id_from_uid(uid)
        record = self._get_or_create_clicker_record(uid=uid, now=now, telegram_user_id=telegram_user_id)

        claimed_at = self._safe_datetime(record.get('daily_bonus_claimed_at'))
        if claimed_at is not None and now < claimed_at + timedelta(days=1):
            return False, 0, 'Daily bonus is not available yet.', self._to_clicker_state(record, now=now)

        level = max(1, int(record.get('level', 1)))
        added_points = level * max(1, settings.clicker_daily_bonus_per_level)
        record['points'] = int(record.get('points', 0)) + added_points
        new_level = self._level_from_points(int(record['points']))
        record['level'] = new_level
        record['multiplier'] = new_level
        record['daily_bonus_claimed_at'] = now
        record['updated_at'] = now

        self._save_clicker_record(record)
        self._upsert_clicker_rating(record)

        return True, added_points, 'Daily bonus claimed.', self._to_clicker_state(record, now=now)

    def apply_referral(
        self,
        uid: str,
        referrer_telegram_id: int,
    ) -> tuple[bool, str, ClickerState]:
        now = datetime.now(timezone.utc)
        telegram_user_id = self._telegram_id_from_uid(uid)
        record = self._get_or_create_clicker_record(uid=uid, now=now, telegram_user_id=telegram_user_id)

        if record.get('referred_by') is not None:
            return False, 'Referral already applied.', self._to_clicker_state(record, now=now)

        if telegram_user_id is not None and telegram_user_id == referrer_telegram_id:
            return False, 'Self-referral is not allowed.', self._to_clicker_state(record, now=now)

        referrer_uid = self.build_clicker_uid(referrer_telegram_id)
        referrer_record = self._get_or_create_clicker_record(
            uid=referrer_uid,
            now=now,
            telegram_user_id=referrer_telegram_id,
        )

        bonus_levels = max(1, settings.clicker_referral_bonus_levels)
        user_target_level = int(record.get('level', 1)) + bonus_levels
        ref_target_level = int(referrer_record.get('level', 1)) + bonus_levels

        record['points'] = max(int(record.get('points', 0)), self._points_for_level(user_target_level))
        record['level'] = self._level_from_points(int(record['points']))
        record['multiplier'] = int(record['level'])
        record['referred_by'] = referrer_telegram_id
        record['updated_at'] = now

        referrer_record['points'] = max(
            int(referrer_record.get('points', 0)),
            self._points_for_level(ref_target_level),
        )
        referrer_record['level'] = self._level_from_points(int(referrer_record['points']))
        referrer_record['multiplier'] = int(referrer_record['level'])
        referrer_record['referrals'] = max(0, int(referrer_record.get('referrals', 0))) + 1
        referrer_record['updated_at'] = now

        self._save_clicker_record(record)
        self._save_clicker_record(referrer_record)
        self._upsert_clicker_rating(record)
        self._upsert_clicker_rating(referrer_record)

        return True, 'Referral bonus applied (+3 levels for both).', self._to_clicker_state(record, now=now)

    def clicker_leaderboard(self, limit: int = 50) -> list[ClickerLeaderboardItem]:
        normalized_limit = min(50, max(1, int(limit)))

        if not self.using_firestore:
            rows = sorted(
                self._clicker_users.values(),
                key=lambda row: (
                    -int(row.get('points', 0)),
                    -(self._safe_datetime(row.get('updated_at')) or datetime.now(timezone.utc)).timestamp(),
                ),
            )[:normalized_limit]
            now = datetime.now(timezone.utc)
            return [
                ClickerLeaderboardItem(
                    rank=index + 1,
                    uid=str(row.get('uid', 'unknown')),
                    telegram_user_id=row.get('telegram_user_id'),
                    display_name=str(row.get('display_name', 'Player')),
                    points=max(0, int(row.get('points', 0))),
                    level=max(1, int(row.get('level', 1))),
                    referrals=max(0, int(row.get('referrals', 0))),
                    updated_at=self._safe_datetime(row.get('updated_at')) or now,
                )
                for index, row in enumerate(rows)
            ]

        docs = (
            self.db.collection('ratings')
            .order_by('points', direction=firestore.Query.DESCENDING)
            .limit(normalized_limit)
            .stream()
        )

        result: list[ClickerLeaderboardItem] = []
        now = datetime.now(timezone.utc)
        for index, doc in enumerate(docs):
            raw = doc.to_dict() or {}
            result.append(
                ClickerLeaderboardItem(
                    rank=index + 1,
                    uid=str(raw.get('uid', doc.id)),
                    telegram_user_id=raw.get('telegram_user_id') if isinstance(raw.get('telegram_user_id'), int) else None,
                    display_name=str(raw.get('display_name', 'Player')),
                    points=max(0, int(raw.get('points', 0))),
                    level=max(1, int(raw.get('level', 1))),
                    referrals=max(0, int(raw.get('referrals', 0))),
                    updated_at=self._safe_datetime(raw.get('updated_at')) or now,
                )
            )
        return result

    def enter_lottery(self, uid: str) -> tuple[bool, str, datetime | None, ClickerState]:
        now = datetime.now(timezone.utc)
        telegram_user_id = self._telegram_id_from_uid(uid)
        record = self._get_or_create_clicker_record(uid=uid, now=now, telegram_user_id=telegram_user_id)

        if bool(record.get('lottery_joined', False)):
            return False, 'You are already in the lottery.', self._safe_datetime(
                record.get('lottery_entered_at')
            ), self._to_clicker_state(record, now=now)

        record['lottery_joined'] = True
        record['lottery_entered_at'] = now
        record['updated_at'] = now

        self._save_clicker_record(record)
        self._upsert_clicker_rating(record)

        entry_payload = {
            'uid': uid,
            'telegram_user_id': record.get('telegram_user_id'),
            'display_name': record.get('display_name', 'Player'),
            'points': int(record.get('points', 0)),
            'level': int(record.get('level', 1)),
            'entered_at': now,
        }

        if not self.using_firestore:
            self._lottery_entries[uid] = entry_payload
        else:
            self.db.collection('lottery').document(uid).set(entry_payload, merge=True)

        return True, 'Lottery entry saved.', now, self._to_clicker_state(record, now=now)

    def list_lottery_entries(self) -> list[ClickerLotteryEntry]:
        now = datetime.now(timezone.utc)
        if not self.using_firestore:
            rows = sorted(
                self._lottery_entries.values(),
                key=lambda row: -(self._safe_datetime(row.get('entered_at')) or now).timestamp(),
            )
            return [
                ClickerLotteryEntry(
                    uid=str(row.get('uid', 'unknown')),
                    telegram_user_id=row.get('telegram_user_id') if isinstance(row.get('telegram_user_id'), int) else None,
                    display_name=str(row.get('display_name', 'Player')),
                    points=max(0, int(row.get('points', 0))),
                    level=max(1, int(row.get('level', 1))),
                    entered_at=self._safe_datetime(row.get('entered_at')) or now,
                )
                for row in rows
            ]

        docs = (
            self.db.collection('lottery')
            .order_by('entered_at', direction=firestore.Query.DESCENDING)
            .limit(1000)
            .stream()
        )

        result: list[ClickerLotteryEntry] = []
        for doc in docs:
            raw = doc.to_dict() or {}
            result.append(
                ClickerLotteryEntry(
                    uid=str(raw.get('uid', doc.id)),
                    telegram_user_id=raw.get('telegram_user_id') if isinstance(raw.get('telegram_user_id'), int) else None,
                    display_name=str(raw.get('display_name', 'Player')),
                    points=max(0, int(raw.get('points', 0))),
                    level=max(1, int(raw.get('level', 1))),
                    entered_at=self._safe_datetime(raw.get('entered_at')) or now,
                )
            )
        return result

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
