from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings
from app.domain.schemas import HealthOut

router = APIRouter(tags=['health'])


@router.get('/health', response_model=HealthOut)
def healthcheck() -> HealthOut:
    return HealthOut(service=settings.app_name, timestamp=datetime.now(timezone.utc))
