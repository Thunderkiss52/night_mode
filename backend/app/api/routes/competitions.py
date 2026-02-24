from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.container import get_night_service
from app.domain.schemas import CityRankingOut
from app.services.night_service import NightService

router = APIRouter(prefix='/api/competitions', tags=['competitions'])


@router.get('/city-ranking', response_model=CityRankingOut)
def city_ranking(
    night_service: NightService = Depends(get_night_service),
) -> CityRankingOut:
    ranking = night_service.list_city_ranking()
    return CityRankingOut(ranking=ranking, updated_at=datetime.now(timezone.utc))
