from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.container import get_night_service
from app.core.security import enforce_uid, get_current_user_optional
from app.domain.schemas import LocationCreateOut, LocationsOut, UserLocationCreate
from app.services.night_service import NightService

router = APIRouter(prefix='/api/locations', tags=['locations'])


@router.get('', response_model=LocationsOut)
def list_locations(
    night_service: NightService = Depends(get_night_service),
) -> LocationsOut:
    return LocationsOut(locations=night_service.list_locations())


@router.post('', response_model=LocationCreateOut)
def create_location(
    payload: UserLocationCreate,
    current_user=Depends(get_current_user_optional),
    night_service: NightService = Depends(get_night_service),
) -> LocationCreateOut:
    enforce_uid(payload.uid, current_user)
    location = night_service.create_location(payload)
    return LocationCreateOut(location=location)
