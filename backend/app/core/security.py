from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError

from .config import settings

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    uid: str
    email: str | None = None


def create_access_token(uid: str, email: str | None = None) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        'sub': uid,
        'email': email,
        'iss': 'night-mode-api',
        'aud': 'night-mode-client',
        'iat': int(now.timestamp()),
        'exp': int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, int((expires_at - now).total_seconds())


def decode_access_token(token: str) -> AuthUser:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            audience='night-mode-client',
            issuer='night-mode-api',
        )
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid access token') from exc

    uid = payload.get('sub')
    if not uid or not isinstance(uid, str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token subject missing')

    email = payload.get('email')
    if email is not None and not isinstance(email, str):
        email = None

    return AuthUser(uid=uid, email=email)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthUser | None:
    if credentials is None:
        return None
    return decode_access_token(credentials.credentials)


def require_user(
    user: AuthUser | None = Depends(get_current_user_optional),
) -> AuthUser:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required')
    return user


def enforce_uid(payload_uid: str, user: AuthUser | None) -> None:
    if user is not None and payload_uid != user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='UID does not match access token')

    if settings.auth_required and user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required')
