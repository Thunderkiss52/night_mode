from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.container import get_auth_service
from app.core.security import require_user
from app.domain.schemas import AuthTokenOut, CurrentUserOut, DevLoginIn, FirebaseLoginIn
from app.services.auth_service import AuthService

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/firebase-login', response_model=AuthTokenOut)
def firebase_login(
    payload: FirebaseLoginIn,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthTokenOut:
    return auth_service.firebase_login(payload.firebase_id_token)


@router.post('/dev-login', response_model=AuthTokenOut)
def dev_login(
    payload: DevLoginIn,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthTokenOut:
    return auth_service.dev_login(uid=payload.uid, email=payload.email)


@router.get('/me', response_model=CurrentUserOut)
def auth_me(current_user=Depends(require_user)) -> CurrentUserOut:
    return CurrentUserOut(uid=current_user.uid, email=current_user.email)
