from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.infrastructure.repositories.night_repository import NightRepository
from app.services.admin_service import AdminService
from app.services.auth_service import AuthService
from app.services.competition_service import CompetitionService
from app.services.night_service import NightService
from app.services.referral_service import ReferralService
from app.services.user_service import UserService
from app.services.wallet_service import WalletService


def get_repository(db: Session = Depends(get_db)) -> NightRepository:
    return NightRepository(db=db)


def get_auth_service(repository: NightRepository = Depends(get_repository)) -> AuthService:
    return AuthService(repository=repository)


def get_night_service(repository: NightRepository = Depends(get_repository)) -> NightService:
    return NightService(repository=repository)


def get_user_service(repository: NightRepository = Depends(get_repository)) -> UserService:
    return UserService(repository=repository)


def get_wallet_service(repository: NightRepository = Depends(get_repository)) -> WalletService:
    return WalletService(repository=repository)


def get_referral_service(repository: NightRepository = Depends(get_repository)) -> ReferralService:
    return ReferralService(repository=repository)


def get_competition_service(repository: NightRepository = Depends(get_repository)) -> CompetitionService:
    return CompetitionService(repository=repository)


def get_admin_service(repository: NightRepository = Depends(get_repository)) -> AdminService:
    return AdminService(repository=repository)
