from __future__ import annotations

from app.domain.schemas import CompetitionLeaderboardOut, CompetitionOut, CompetitionsOut
from app.infrastructure.repositories.night_repository import NightRepository


class CompetitionService:
    def __init__(self, repository: NightRepository) -> None:
        self.repository = repository

    def list_competitions(self) -> CompetitionsOut:
        return CompetitionsOut(items=self.repository.list_competitions())

    def get_competition(self, competition_id: str) -> CompetitionOut:
        return CompetitionOut(item=self.repository.get_competition(competition_id))

    def get_leaderboard(self, competition_id: str, limit: int = 50) -> CompetitionLeaderboardOut:
        return CompetitionLeaderboardOut(items=self.repository.get_competition_leaderboard(competition_id, limit=limit))
