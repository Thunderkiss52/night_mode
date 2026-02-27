from __future__ import annotations

from datetime import datetime

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
        return self.repository.create_location(payload)

    def list_city_ranking(self) -> list[CityRankingItem]:
        return self.repository.list_city_ranking()

    def bind_qr(self, payload: QrBindIn) -> tuple[bool, str, str | None]:
        return self.repository.bind_qr(payload)

    def build_clicker_uid(self, telegram_user_id: int) -> str:
        return self.repository.build_clicker_uid(telegram_user_id)

    def upsert_clicker_user(
        self,
        telegram_user_id: int,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> ClickerState:
        return self.repository.upsert_clicker_user(
            telegram_user_id=telegram_user_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
        )

    def get_clicker_state(self, uid: str) -> ClickerState:
        return self.repository.get_clicker_state(uid)

    def tap_clicker(self, uid: str, taps: int) -> tuple[bool, int, int, int, bool, str, ClickerState]:
        return self.repository.tap_clicker(uid=uid, taps=taps)

    def claim_daily_bonus(self, uid: str) -> tuple[bool, int, str, ClickerState]:
        return self.repository.claim_daily_bonus(uid=uid)

    def apply_referral(self, uid: str, referrer_telegram_id: int) -> tuple[bool, str, ClickerState]:
        return self.repository.apply_referral(uid=uid, referrer_telegram_id=referrer_telegram_id)

    def clicker_leaderboard(self, limit: int = 50) -> list[ClickerLeaderboardItem]:
        return self.repository.clicker_leaderboard(limit=limit)

    def enter_lottery(self, uid: str) -> tuple[bool, str, datetime | None, ClickerState]:
        return self.repository.enter_lottery(uid=uid)

    def list_lottery_entries(self) -> list[ClickerLotteryEntry]:
        return self.repository.list_lottery_entries()
