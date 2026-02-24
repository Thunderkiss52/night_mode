from __future__ import annotations

from app.domain.schemas import CityRankingItem, QrBindIn, UserLocation, UserLocationCreate
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
