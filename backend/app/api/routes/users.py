from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.container import get_user_service
from app.core.security import require_user
from app.domain.schemas import UpdateProfileIn, UserProfileOut
from app.models.entities import User
from app.services.user_service import UserService

router = APIRouter(tags=['users'])


@router.get('/users/me/profile', response_model=UserProfileOut)
def get_my_profile(
    current_user: User = Depends(require_user),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileOut:
    return user_service.get_profile(current_user)


@router.patch('/users/me/profile', response_model=UserProfileOut)
def update_my_profile(
    payload: UpdateProfileIn,
    current_user: User = Depends(require_user),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileOut:
    return user_service.update_profile(current_user, payload)
