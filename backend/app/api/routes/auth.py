from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.config import settings
from app.core.container import get_auth_service
from app.core.security import get_current_user_optional, require_user
from app.domain.schemas import (
    AccessTokenOut,
    AuthLogoutIn,
    AuthRefreshIn,
    AuthTelegramIn,
    AuthTokenOut,
    CurrentUserOut,
)
from app.models.entities import User
from app.services.auth_service import AuthService

router = APIRouter(tags=['auth'])


def _set_refresh_cookie(response: Response, refresh_token: str, max_age: int) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=max_age,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        domain=settings.refresh_cookie_domain or None,
        path='/',
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        domain=settings.refresh_cookie_domain or None,
        path='/',
    )


def _refresh_from_body_or_cookie(payload_token: str | None, request: Request) -> str | None:
    if payload_token:
        return payload_token
    cookie_token = request.cookies.get(settings.refresh_cookie_name)
    if cookie_token:
        return cookie_token
    return None


@router.post('/auth/telegram', response_model=AuthTokenOut)
def telegram_login(
    payload: AuthTelegramIn,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthTokenOut:
    result = auth_service.telegram_login(
        payload=payload,
        user_agent=request.headers.get('user-agent'),
        ip_address=request.client.host if request.client else None,
    )
    _set_refresh_cookie(response, result.refresh_token, result.refresh_expires_in)
    return result


@router.post('/auth/refresh', response_model=AccessTokenOut)
def refresh_token(
    payload: AuthRefreshIn,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> AccessTokenOut:
    refresh_token = _refresh_from_body_or_cookie(payload.refresh_token, request)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token is required')
    result = auth_service.refresh(
        refresh_token=refresh_token,
        user_agent=request.headers.get('user-agent'),
        ip_address=request.client.host if request.client else None,
    )
    _set_refresh_cookie(response, result.refresh_token, result.refresh_expires_in)
    return result


@router.post('/auth/logout', status_code=status.HTTP_200_OK, response_class=Response)
def logout(
    payload: AuthLogoutIn,
    request: Request,
    response: Response,
    current_user: User | None = Depends(get_current_user_optional),
    auth_service: AuthService = Depends(get_auth_service),
) -> Response:
    refresh_token = _refresh_from_body_or_cookie(payload.refresh_token, request)
    auth_service.logout(refresh_token=refresh_token, session_id=payload.session_id, user=current_user)
    _clear_refresh_cookie(response)
    return Response(status_code=status.HTTP_200_OK)


@router.get('/auth/me', response_model=CurrentUserOut)
def auth_me(
    current_user: User = Depends(require_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> CurrentUserOut:
    return auth_service.me(current_user)
