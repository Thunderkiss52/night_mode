from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import Select, desc, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.geocoder import ReverseGeocoder
from app.core.security import (
    generate_refresh_token,
    hash_refresh_token,
)
from app.domain.schemas import (
    AdminAdjustBalanceOut,
    AdminAuditLogItem,
    AdminUserItem,
    BalanceTransactionItem,
    CityRankingItem,
    ClickerLeaderboardItem,
    ClickerLotteryEntry,
    ClickerState,
    CompetitionItem,
    CompetitionLeaderboardItem,
    DailyBonusOut,
    LocationCreateOut,
    ReferralApplyOut,
    ReferralItem,
    ReferralsOut,
    UpdateProfileIn,
    UserLocation,
    UserProfile,
    UserProfileOut,
    UserLocationCreate,
    QrBindIn,
)
from app.infrastructure.stores.memory_store import make_qr_hash
from app.models.entities import (
    AdminAuditLog,
    BalanceTransaction,
    Competition,
    CompetitionScore,
    DailyReward,
    LotteryEntry,
    QrBinding,
    Referral,
    User,
    UserBalance,
    UserLocation as UserLocationModel,
    UserSession,
)


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

    def __init__(self, db: Session) -> None:
        self.db = db
        self.geocoder = ReverseGeocoder(settings=settings)

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _utc_day_start(value: date) -> datetime:
        return datetime.combine(value, time.min, tzinfo=timezone.utc)

    @staticmethod
    def build_clicker_uid(telegram_user_id: int) -> str:
        return f'tg:{telegram_user_id}'

    @staticmethod
    def _display_name(user: User) -> str:
        full_name = ' '.join(part for part in [user.first_name or '', user.last_name or ''] if part.strip()).strip()
        if full_name:
            return full_name
        if user.username:
            return f'@{user.username.lstrip("@")}'
        if user.telegram_id is not None:
            return f'tg:{user.telegram_id}'
        return user.id

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
        return cls._points_for_level(max(1, level) + 1)

    @classmethod
    def _is_placeholder(cls, value: str | None) -> bool:
        return (value or '').strip().lower() in cls._PLACEHOLDER_VALUES

    def _generate_referral_code(self) -> str:
        for _ in range(20):
            candidate = uuid4().hex[:10].upper()
            exists = self.db.execute(select(User.id).where(User.referral_code == candidate)).scalar_one_or_none()
            if exists is None:
                return candidate
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Could not generate referral code')

    def _require_user(self, user_id: str) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        return user

    def get_user_by_id(self, user_id: str) -> User:
        return self._require_user(user_id)

    def get_user_by_telegram_id(self, telegram_id: int) -> User | None:
        return self.db.execute(select(User).where(User.telegram_id == telegram_id)).scalar_one_or_none()

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    def get_user_by_referral_code(self, referral_code: str) -> User | None:
        return self.db.execute(
            select(User).where(User.referral_code == referral_code.strip().upper())
        ).scalar_one_or_none()

    def _ensure_balance(self, user_id: str) -> UserBalance:
        balance = self.db.execute(select(UserBalance).where(UserBalance.user_id == user_id)).scalar_one_or_none()
        if balance is None:
            balance = UserBalance(user_id=user_id, balance=0, updated_at=self._now())
            self.db.add(balance)
            self.db.flush()
        return balance

    def get_balance(self, user_id: str) -> UserBalance:
        self._require_user(user_id)
        return self._ensure_balance(user_id)

    def _lock_balance(self, user_id: str) -> UserBalance:
        balance = self.db.execute(
            select(UserBalance).where(UserBalance.user_id == user_id).with_for_update()
        ).scalar_one_or_none()
        if balance is None:
            balance = UserBalance(user_id=user_id, balance=0, updated_at=self._now())
            self.db.add(balance)
            self.db.flush()
            balance = self.db.execute(
                select(UserBalance).where(UserBalance.user_id == user_id).with_for_update()
            ).scalar_one()
        return balance

    def _record_balance_change(
        self,
        user_id: str,
        amount: int,
        tx_type: str,
        direction: str,
        source: str,
        meta: dict | None = None,
    ) -> tuple[UserBalance, BalanceTransaction]:
        if amount <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Amount must be positive')

        balance = self._lock_balance(user_id)
        delta = amount if direction == 'credit' else -amount
        if direction == 'debit' and balance.balance < amount:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Insufficient balance')

        balance.balance += delta
        balance.updated_at = self._now()

        tx = BalanceTransaction(
            user_id=user_id,
            type=tx_type,
            amount=amount,
            direction=direction,
            source=source,
            meta=meta,
            created_at=self._now(),
        )
        self.db.add(tx)
        self.db.flush()
        return balance, tx

    def build_user_profile(self, user: User) -> UserProfile:
        balance = self.get_balance(user.id)
        return UserProfile(
            id=user.id,
            telegram_id=user.telegram_id,
            email=user.email,
            referral_code=user.referral_code,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            photo_url=user.photo_url,
            language_code=user.language_code,
            role=user.role,
            is_active=user.is_active,
            is_admin=user.is_admin,
            balance=balance.balance,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def update_user_profile(self, user: User, payload: UpdateProfileIn) -> User:
        if payload.username is not None:
            user.username = payload.username or None
        if payload.first_name is not None:
            user.first_name = payload.first_name or None
        if payload.last_name is not None:
            user.last_name = payload.last_name or None
        if payload.photo_url is not None:
            user.photo_url = payload.photo_url or None
        if payload.language_code is not None:
            user.language_code = payload.language_code or None
        user.updated_at = self._now()
        self.db.flush()
        return user

    def upsert_telegram_user(
        self,
        telegram_user_id: int,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
        photo_url: str | None = None,
        language_code: str | None = None,
    ) -> tuple[User, bool]:
        now = self._now()
        user = self.get_user_by_telegram_id(telegram_user_id)
        created = False

        if user is None:
            user = User(
                telegram_id=telegram_user_id,
                username=username,
                first_name=first_name,
                last_name=last_name,
                photo_url=photo_url,
                language_code=language_code,
                role='user',
                is_active=True,
                is_admin=False,
                referral_code=self._generate_referral_code(),
                last_login_at=now,
                created_at=now,
                updated_at=now,
            )
            self.db.add(user)
            self.db.flush()
            self._ensure_balance(user.id)
            created = True
        else:
            user.username = username if username is not None else user.username
            user.first_name = first_name if first_name is not None else user.first_name
            user.last_name = last_name if last_name is not None else user.last_name
            user.photo_url = photo_url if photo_url is not None else user.photo_url
            user.language_code = language_code if language_code is not None else user.language_code
            user.last_login_at = now
            user.updated_at = now

        self.db.flush()
        return user, created

    def create_refresh_session(
        self,
        user_id: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[str, int]:
        token = generate_refresh_token()
        expires_at = self._now() + timedelta(days=settings.jwt_refresh_expire_days)
        session = UserSession(
            user_id=user_id,
            token_hash=hash_refresh_token(token),
            user_agent=user_agent,
            ip_address=ip_address,
            is_revoked=False,
            expires_at=expires_at,
            created_at=self._now(),
        )
        self.db.add(session)
        self.db.flush()
        ttl = int((expires_at - self._now()).total_seconds())
        return token, ttl

    def _get_session_by_refresh_token(self, refresh_token: str) -> UserSession:
        session = self.db.execute(
            select(UserSession).where(UserSession.token_hash == hash_refresh_token(refresh_token))
        ).scalar_one_or_none()
        if session is None or session.is_revoked or session.expires_at <= self._now():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token is invalid or expired')
        return session

    def rotate_refresh_session(
        self,
        refresh_token: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[User, str, int]:
        session = self._get_session_by_refresh_token(refresh_token)
        session.is_revoked = True
        session.revoked_at = self._now()
        user = self._require_user(session.user_id)
        new_token, ttl = self.create_refresh_session(user.id, user_agent=user_agent, ip_address=ip_address)
        self.db.flush()
        return user, new_token, ttl

    def revoke_refresh_session(
        self,
        refresh_token: str | None = None,
        session_id: str | None = None,
        user_id: str | None = None,
    ) -> None:
        session: UserSession | None = None
        if refresh_token:
            session = self.db.execute(
                select(UserSession).where(UserSession.token_hash == hash_refresh_token(refresh_token))
            ).scalar_one_or_none()
        elif session_id:
            session = self.db.get(UserSession, session_id)

        if session is None:
            return
        if user_id is not None and session.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Session does not belong to user')

        session.is_revoked = True
        session.revoked_at = self._now()
        self.db.flush()

    def list_transactions(self, user_id: str, limit: int = 50) -> list[BalanceTransactionItem]:
        rows = self.db.execute(
            select(BalanceTransaction)
            .where(BalanceTransaction.user_id == user_id)
            .order_by(BalanceTransaction.created_at.desc())
            .limit(max(1, min(limit, 200)))
        ).scalars().all()

        return [
            BalanceTransactionItem(
                id=row.id,
                type=row.type,
                direction=row.direction,
                amount=row.amount,
                source=row.source,
                meta=row.meta,
                created_at=row.created_at,
            )
            for row in rows
        ]

    def _resolve_referrer(
        self,
        referral_code: str | None = None,
        referrer_telegram_id: int | None = None,
    ) -> User:
        referrer: User | None = None
        if referral_code:
            referrer = self.get_user_by_referral_code(referral_code)
        elif referrer_telegram_id is not None:
            referrer = self.get_user_by_telegram_id(referrer_telegram_id)

        if referrer is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Referrer not found')
        return referrer

    def apply_referral(
        self,
        user_id: str,
        referral_code: str | None = None,
        referrer_telegram_id: int | None = None,
        source: str | None = None,
    ) -> ReferralApplyOut:
        user = self._require_user(user_id)
        existing = self.db.execute(select(Referral).where(Referral.referred_user_id == user_id)).scalar_one_or_none()
        if existing is not None:
            balance = self.get_balance(user_id)
            return ReferralApplyOut(ok=False, message='Referral already applied.', balance=balance.balance)

        referrer = self._resolve_referrer(referral_code=referral_code, referrer_telegram_id=referrer_telegram_id)
        if referrer.id == user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Self-referral is not allowed')

        referral = Referral(
            referrer_user_id=referrer.id,
            referred_user_id=user.id,
            source=source,
            created_at=self._now(),
        )
        self.db.add(referral)
        if settings.referral_bonus_referrer > 0:
            self._record_balance_change(
                user_id=referrer.id,
                amount=settings.referral_bonus_referrer,
                tx_type='referral_bonus',
                direction='credit',
                source='referral',
                meta={'referred_user_id': user.id},
            )
        balance = self.get_balance(user.id)
        if settings.referral_bonus_referred > 0:
            balance, _ = self._record_balance_change(
                user_id=user.id,
                amount=settings.referral_bonus_referred,
                tx_type='referral_bonus',
                direction='credit',
                source='referral',
                meta={'referrer_user_id': referrer.id},
            )
        self.db.flush()
        return ReferralApplyOut(ok=True, message='Referral applied successfully.', balance=balance.balance)

    def claim_daily_bonus(self, user_id: str) -> tuple[bool, date | None, int, str, UserBalance]:
        today = self._now().date()
        existing = self.db.execute(
            select(DailyReward).where(DailyReward.user_id == user_id, DailyReward.reward_date == today)
        ).scalar_one_or_none()
        balance = self.get_balance(user_id)
        if existing is not None:
            return False, today, 0, 'Daily bonus already claimed today.', balance

        level = self._level_from_points(balance.balance)
        amount = max(1, level) * max(1, settings.clicker_daily_bonus_per_level)
        reward = DailyReward(
            user_id=user_id,
            reward_date=today,
            level=level,
            amount=amount,
            created_at=self._now(),
        )
        self.db.add(reward)
        balance, _ = self._record_balance_change(
            user_id=user_id,
            amount=amount,
            tx_type='daily_bonus',
            direction='credit',
            source='daily_reward',
            meta={'reward_date': today.isoformat(), 'level': level},
        )
        self.db.flush()
        return True, today, amount, 'Daily bonus claimed.', balance

    def get_referral_stats(self, user_id: str) -> ReferralsOut:
        user = self._require_user(user_id)
        referrer_link = self.db.execute(
            select(Referral).where(Referral.referred_user_id == user_id)
        ).scalar_one_or_none()
        rows = self.db.execute(
            select(Referral, User)
            .join(User, User.id == Referral.referred_user_id)
            .where(Referral.referrer_user_id == user_id)
            .order_by(Referral.created_at.desc())
        ).all()
        items = [
            ReferralItem(
                user_id=referred_user.id,
                username=referred_user.username,
                first_name=referred_user.first_name,
                last_name=referred_user.last_name,
                created_at=referral.created_at,
            )
            for referral, referred_user in rows
        ]
        return ReferralsOut(
            my_referral_code=user.referral_code,
            referred_by_user_id=referrer_link.referrer_user_id if referrer_link else None,
            referrals_count=len(items),
            items=items,
        )

    def list_competitions(self) -> list[CompetitionItem]:
        rows = self.db.execute(select(Competition).order_by(Competition.created_at.desc())).scalars().all()
        return [
            CompetitionItem(
                id=row.id,
                title=row.title,
                description=row.description,
                status=row.status,
                starts_at=row.starts_at,
                ends_at=row.ends_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )
            for row in rows
        ]

    def get_competition(self, competition_id: str) -> CompetitionItem:
        row = self.db.get(Competition, competition_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Competition not found')
        return CompetitionItem(
            id=row.id,
            title=row.title,
            description=row.description,
            status=row.status,
            starts_at=row.starts_at,
            ends_at=row.ends_at,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    def get_competition_leaderboard(self, competition_id: str, limit: int = 50) -> list[CompetitionLeaderboardItem]:
        if self.db.get(Competition, competition_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Competition not found')

        rows = self.db.execute(
            select(CompetitionScore, User)
            .join(User, User.id == CompetitionScore.user_id)
            .where(CompetitionScore.competition_id == competition_id)
            .order_by(CompetitionScore.score.desc(), CompetitionScore.updated_at.desc())
            .limit(max(1, min(limit, 100)))
        ).all()
        return [
            CompetitionLeaderboardItem(
                rank=index + 1,
                user_id=user.id,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                score=score.score,
                updated_at=score.updated_at,
            )
            for index, (score, user) in enumerate(rows)
        ]

    def list_users(self, limit: int = 100) -> list[AdminUserItem]:
        users = self.db.execute(
            select(User).order_by(User.created_at.desc()).limit(max(1, min(limit, 200)))
        ).scalars().all()
        return [
            AdminUserItem(
                id=user.id,
                telegram_id=user.telegram_id,
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                role=user.role,
                is_active=user.is_active,
                is_admin=user.is_admin,
                balance=self.get_balance(user.id).balance,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
            for user in users
        ]

    def get_admin_user(self, user_id: str) -> AdminUserItem:
        user = self._require_user(user_id)
        balance = self.get_balance(user.id)
        return AdminUserItem(
            id=user.id,
            telegram_id=user.telegram_id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            is_admin=user.is_admin,
            balance=balance.balance,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def admin_adjust_balance(
        self,
        admin_user_id: str,
        target_user_id: str,
        amount: int,
        reason: str,
    ) -> AdminAdjustBalanceOut:
        target_user = self._require_user(target_user_id)
        balance = self._lock_balance(target_user.id)
        old_data = {'balance': balance.balance}

        direction = 'credit' if amount > 0 else 'debit'
        updated_balance, tx = self._record_balance_change(
            user_id=target_user.id,
            amount=abs(amount),
            tx_type='admin_adjustment',
            direction=direction,
            source='admin',
            meta={'reason': reason, 'admin_user_id': admin_user_id},
        )
        self.db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id,
                target_user_id=target_user.id,
                action='adjust_balance',
                old_data=old_data,
                new_data={'balance': updated_balance.balance, 'amount': amount, 'reason': reason},
                created_at=self._now(),
            )
        )
        self.db.flush()
        return AdminAdjustBalanceOut(balance=updated_balance.balance, transaction_id=tx.id)

    def list_audit_logs(self, limit: int = 100) -> list[AdminAuditLogItem]:
        rows = self.db.execute(
            select(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(max(1, min(limit, 200)))
        ).scalars().all()
        return [
            AdminAuditLogItem(
                id=row.id,
                admin_user_id=row.admin_user_id,
                target_user_id=row.target_user_id,
                action=row.action,
                old_data=row.old_data,
                new_data=row.new_data,
                created_at=row.created_at,
            )
            for row in rows
        ]

    def list_locations(self) -> list[UserLocation]:
        rows = self.db.execute(
            select(UserLocationModel).order_by(UserLocationModel.created_at.desc()).limit(2000)
        ).scalars().all()
        return [
            UserLocation(
                id=row.id,
                uid=row.user_id,
                name=row.name,
                city=row.city,
                country=row.country,
                lat=row.lat,
                lng=row.lng,
                created_at=row.created_at,
            )
            for row in rows
        ]

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

    def create_location(self, payload: UserLocationCreate) -> UserLocation:
        self._require_user(payload.uid)
        city, country = self._resolve_location_details(payload)
        row = UserLocationModel(
            user_id=payload.uid,
            name=payload.name,
            city=city,
            country=country,
            lat=payload.lat,
            lng=payload.lng,
            created_at=self._now(),
            updated_at=self._now(),
        )
        self.db.add(row)
        self.db.flush()
        return UserLocation(
            id=row.id,
            uid=row.user_id,
            name=row.name,
            city=row.city,
            country=row.country,
            lat=row.lat,
            lng=row.lng,
            created_at=row.created_at,
        )

    def list_city_ranking(self) -> list[CityRankingItem]:
        rows = self.db.execute(
            select(
                QrBinding.city,
                QrBinding.country,
                func.count(QrBinding.id).label('count_items'),
                func.max(QrBinding.bound_at).label('updated_at'),
            )
            .group_by(QrBinding.city, QrBinding.country)
            .order_by(desc('count_items'))
            .limit(10)
        ).all()

        return [
            CityRankingItem(
                city=city,
                country=country,
                count_items=int(count_items),
                updated_at=updated_at or self._now(),
            )
            for city, country, count_items, updated_at in rows
        ]

    def bind_qr(self, payload: QrBindIn) -> tuple[bool, str, str | None]:
        self._require_user(payload.uid)
        qr_id = payload.qr_id.strip().upper()
        if not qr_id.startswith('NM-'):
            return False, 'QR format invalid', None

        existing = self.db.execute(select(QrBinding).where(QrBinding.qr_id == qr_id)).scalar_one_or_none()
        if existing is not None:
            return False, 'Этот QR уже привязан к другому профилю', None

        secure_hash = make_qr_hash(qr_id)
        city = payload.city.strip()
        binding = QrBinding(
            qr_id=qr_id,
            owner_user_id=payload.uid,
            item_name=payload.item_name,
            city=city,
            country='Unknown',
            secure_hash=secure_hash,
            status='bound',
            bound_at=self._now(),
        )
        self.db.add(binding)
        self.db.flush()
        return True, 'QR успешно привязан к профилю', secure_hash

    def _get_referred_by_telegram_id(self, user_id: str) -> int | None:
        row = self.db.execute(
            select(User.telegram_id)
            .join(Referral, Referral.referrer_user_id == User.id)
            .where(Referral.referred_user_id == user_id)
        ).scalar_one_or_none()
        return row

    def get_clicker_state(self, user_id: str, taps_in_current_second: int = 0) -> ClickerState:
        user = self._require_user(user_id)
        balance = self.get_balance(user_id)
        level = self._level_from_points(balance.balance)
        referrals_count = self.db.execute(
            select(func.count(Referral.id)).where(Referral.referrer_user_id == user_id)
        ).scalar_one() or 0
        latest_daily = self.db.execute(
            select(DailyReward)
            .where(DailyReward.user_id == user_id)
            .order_by(DailyReward.reward_date.desc())
            .limit(1)
        ).scalar_one_or_none()
        today = self._now().date()
        daily_bonus_available = latest_daily is None or latest_daily.reward_date < today
        next_daily_bonus_at = None
        if latest_daily is not None and latest_daily.reward_date == today:
            next_daily_bonus_at = self._utc_day_start(today + timedelta(days=1))
        lottery_entry = self.db.execute(
            select(LotteryEntry).where(LotteryEntry.user_id == user_id)
        ).scalar_one_or_none()

        return ClickerState(
            uid=user.id,
            telegram_user_id=user.telegram_id,
            username=user.username,
            display_name=self._display_name(user),
            points=balance.balance,
            level=level,
            multiplier=level,
            referrals=int(referrals_count),
            referred_by=self._get_referred_by_telegram_id(user_id),
            daily_bonus_available=daily_bonus_available,
            daily_bonus_claimed_at=latest_daily.created_at if latest_daily else None,
            next_daily_bonus_at=next_daily_bonus_at,
            lottery_joined=lottery_entry is not None,
            lottery_entered_at=lottery_entry.created_at if lottery_entry else None,
            night_mode_unlocked=balance.balance > 0,
            taps_in_current_second=max(0, taps_in_current_second),
            level_start_points=self._points_for_level(level),
            next_level_points=self._next_level_points(level),
            updated_at=max(user.updated_at, balance.updated_at),
        )

    def tap_clicker(self, user_id: str, taps: int) -> tuple[bool, int, int, int, bool, str, ClickerState]:
        requested_taps = max(1, int(taps))
        max_taps = max(1, settings.clicker_max_taps_per_second)
        accepted_taps = min(requested_taps, max_taps)
        rejected_taps = max(0, requested_taps - accepted_taps)
        throttled = accepted_taps == 0

        balance = self.get_balance(user_id)
        level = self._level_from_points(balance.balance)
        added_points = accepted_taps * max(1, level)
        if added_points > 0:
            self._record_balance_change(
                user_id=user_id,
                amount=added_points,
                tx_type='tap_reward',
                direction='credit',
                source='clicker',
                meta={'taps': accepted_taps, 'multiplier': max(1, level)},
            )
            self.db.flush()

        if throttled:
            message = f'Tap limit reached. Max {max_taps} taps/request.'
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
            self.get_clicker_state(user_id, taps_in_current_second=accepted_taps),
        )

    def clicker_leaderboard(self, limit: int = 50) -> list[ClickerLeaderboardItem]:
        rows = self.db.execute(
            select(User, UserBalance)
            .join(UserBalance, UserBalance.user_id == User.id)
            .order_by(UserBalance.balance.desc(), UserBalance.updated_at.desc())
            .limit(max(1, min(limit, 50)))
        ).all()

        result: list[ClickerLeaderboardItem] = []
        for index, (user, balance) in enumerate(rows):
            referrals_count = self.db.execute(
                select(func.count(Referral.id)).where(Referral.referrer_user_id == user.id)
            ).scalar_one() or 0
            result.append(
                ClickerLeaderboardItem(
                    rank=index + 1,
                    uid=user.id,
                    telegram_user_id=user.telegram_id,
                    display_name=self._display_name(user),
                    points=balance.balance,
                    level=self._level_from_points(balance.balance),
                    referrals=int(referrals_count),
                    updated_at=balance.updated_at,
                )
            )
        return result

    def enter_lottery(self, user_id: str) -> tuple[bool, str, datetime | None, ClickerState]:
        entry = self.db.execute(select(LotteryEntry).where(LotteryEntry.user_id == user_id)).scalar_one_or_none()
        if entry is not None:
            return False, 'You are already in the lottery.', entry.created_at, self.get_clicker_state(user_id)

        entry = LotteryEntry(user_id=user_id, created_at=self._now())
        self.db.add(entry)
        self.db.flush()
        return True, 'Lottery entry saved.', entry.created_at, self.get_clicker_state(user_id)

    def list_lottery_entries(self) -> list[ClickerLotteryEntry]:
        rows = self.db.execute(
            select(LotteryEntry, User, UserBalance)
            .join(User, User.id == LotteryEntry.user_id)
            .join(UserBalance, UserBalance.user_id == User.id)
            .order_by(LotteryEntry.created_at.desc())
        ).all()
        return [
            ClickerLotteryEntry(
                uid=user.id,
                telegram_user_id=user.telegram_id,
                display_name=self._display_name(user),
                points=balance.balance,
                level=self._level_from_points(balance.balance),
                entered_at=entry.created_at,
            )
            for entry, user, balance in rows
        ]
