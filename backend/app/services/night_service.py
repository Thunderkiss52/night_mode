from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token
from app.core.telegram_webapp import TelegramInitDataError, verify_telegram_init_data
from app.domain.schemas import (
    CityRankingItem,
    ClickerLeaderboardItem,
    ClickerLotteryEntry,
    ClickerState,
    QrBindIn,
    UserLocation,
    UserLocationCreate,
)
from app.infrastructure.repositories.night_repository import NightRepository


class NightService:
    def __init__(self, repository: NightRepository) -> None:
        self.repository = repository

    def list_locations(self) -> list[UserLocation]:
        return self.repository.list_locations()

    def create_location(self, payload: UserLocationCreate) -> UserLocation:
        location = self.repository.create_location(payload)
        self.repository.commit()
        return location

    def list_city_ranking(self) -> list[CityRankingItem]:
        return self.repository.list_city_ranking()

    def bind_qr(self, payload: QrBindIn) -> tuple[bool, str, str | None]:
        result = self.repository.bind_qr(payload)
        self.repository.commit()
        return result

    def build_clicker_uid(self, telegram_user_id: int) -> str:
        return self.repository.build_clicker_uid(telegram_user_id)

    def upsert_clicker_user(
        self,
        telegram_user_id: int,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> ClickerState:
        user, _ = self.repository.upsert_telegram_user(
            telegram_user_id=telegram_user_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
        self.repository.commit()
        return self.repository.get_clicker_state(user.id)

    def clicker_auth_telegram(
        self,
        init_data: str | None = None,
        dev_telegram_user_id: int | None = None,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> tuple[str, int, str, str | None, ClickerState]:
        start_param: str | None = None

        if init_data:
            try:
                tg_user = verify_telegram_init_data(
                    init_data=init_data,
                    bot_token=settings.telegram_bot_token,
                    max_age_seconds=settings.telegram_initdata_max_age_seconds,
                )
            except TelegramInitDataError as exc:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
            telegram_user_id = tg_user.telegram_user_id
            username = tg_user.username
            first_name = tg_user.first_name
            last_name = tg_user.last_name
            start_param = tg_user.start_param
        else:
            if settings.app_env.lower() == 'production':
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='init_data is required in production')
            if dev_telegram_user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='Provide init_data or dev_telegram_user_id',
                )
            telegram_user_id = dev_telegram_user_id

        user, _ = self.repository.upsert_telegram_user(
            telegram_user_id=telegram_user_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
        access_token, expires_in = create_access_token(
            user_id=user.id,
            role=user.role,
            is_admin=user.is_admin,
        )
        self.repository.commit()
        return access_token, expires_in, user.id, start_param, self.repository.get_clicker_state(user.id)

    def get_clicker_state(self, uid: str) -> ClickerState:
        return self.repository.get_clicker_state(uid)

    def tap_clicker(self, uid: str, taps: int) -> tuple[bool, int, int, int, bool, str, ClickerState]:
        result = self.repository.tap_clicker(user_id=uid, taps=taps)
        self.repository.commit()
        return result

    def claim_daily_bonus(self, uid: str) -> tuple[bool, int, str, ClickerState]:
        ok, _, amount, message, _ = self.repository.claim_daily_bonus(uid)
        self.repository.commit()
        return ok, amount, message, self.repository.get_clicker_state(uid)

    def apply_referral(self, uid: str, referrer_telegram_id: int) -> tuple[bool, str, ClickerState]:
        result = self.repository.apply_referral(
            user_id=uid,
            referrer_telegram_id=referrer_telegram_id,
            source='clicker',
        )
        self.repository.commit()
        return result.ok, result.message, self.repository.get_clicker_state(uid)

    def clicker_leaderboard(self, limit: int = 50) -> list[ClickerLeaderboardItem]:
        return self.repository.clicker_leaderboard(limit=limit)

    def enter_lottery(self, uid: str) -> tuple[bool, str, datetime | None, ClickerState]:
        result = self.repository.enter_lottery(user_id=uid)
        self.repository.commit()
        return result

    def list_lottery_entries(self) -> list[ClickerLotteryEntry]:
        return self.repository.list_lottery_entries()
