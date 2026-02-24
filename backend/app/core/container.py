from __future__ import annotations

from functools import lru_cache

from app.infrastructure.repositories.night_repository import NightRepository
from app.services.auth_service import AuthService
from app.services.night_service import NightService


@lru_cache(maxsize=1)
def get_repository() -> NightRepository:
    return NightRepository()


@lru_cache(maxsize=1)
def get_auth_service() -> AuthService:
    return AuthService()


@lru_cache(maxsize=1)
def get_night_service() -> NightService:
    return NightService(repository=get_repository())
