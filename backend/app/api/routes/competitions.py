from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query

from app.core.container import get_competition_service, get_night_service
from app.domain.schemas import (
    CityRankingOut,
    CompetitionLeaderboardOut,
    CompetitionOut,
    CompetitionsOut,
)
from app.services.competition_service import CompetitionService
from app.services.night_service import NightService

router = APIRouter(tags=['competitions'])


@router.get('/competitions', response_model=CompetitionsOut)
def list_competitions(
    competition_service: CompetitionService = Depends(get_competition_service),
) -> CompetitionsOut:
    return competition_service.list_competitions()


@router.get('/competitions/{competition_id}', response_model=CompetitionOut)
def get_competition(
    competition_id: str,
    competition_service: CompetitionService = Depends(get_competition_service),
) -> CompetitionOut:
    return competition_service.get_competition(competition_id)


@router.get('/competitions/{competition_id}/leaderboard', response_model=CompetitionLeaderboardOut)
def get_competition_leaderboard(
    competition_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    competition_service: CompetitionService = Depends(get_competition_service),
) -> CompetitionLeaderboardOut:
    return competition_service.get_leaderboard(competition_id, limit=limit)


@router.get('/api/competitions/city-ranking', response_model=CityRankingOut)
def city_ranking(
    night_service: NightService = Depends(get_night_service),
) -> CityRankingOut:
    ranking = night_service.list_city_ranking()
    return CityRankingOut(ranking=ranking, updated_at=datetime.now(timezone.utc))
