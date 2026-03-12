from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
from base64 import urlsafe_b64decode, urlsafe_b64encode

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.entities import User
from .config import settings

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    user_id: str
    role: str
    is_admin: bool


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _b64(value: bytes) -> str:
    return urlsafe_b64encode(value).decode('utf-8').rstrip('=')


def _unb64(value: str) -> bytes:
    padding = '=' * (-len(value) % 4)
    return urlsafe_b64decode(f'{value}{padding}')


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(
        password.encode('utf-8'),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
        dklen=64,
    )
    return f'scrypt$16384$8$1${_b64(salt)}${_b64(derived)}'


def verify_password(password: str, password_hash: str) -> bool:
    try:
        _, n_raw, r_raw, p_raw, salt_raw, derived_raw = password_hash.split('$', 5)
        salt = _unb64(salt_raw)
        expected = _unb64(derived_raw)
        actual = hashlib.scrypt(
            password.encode('utf-8'),
            salt=salt,
            n=int(n_raw),
            r=int(r_raw),
            p=int(p_raw),
            dklen=len(expected),
        )
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(f'{settings.jwt_secret}:{token}'.encode('utf-8')).hexdigest()


def create_access_token(user_id: str, role: str = 'user', is_admin: bool = False) -> tuple[str, int]:
    now = _now()
    expires_at = now + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        'sub': user_id,
        'role': role,
        'is_admin': is_admin,
        'iss': settings.jwt_issuer,
        'aud': settings.jwt_audience,
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
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid access token') from exc

    user_id = payload.get('sub')
    if not user_id or not isinstance(user_id, str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token subject missing')

    role = payload.get('role')
    if not isinstance(role, str):
        role = 'user'

    is_admin = bool(payload.get('is_admin', False))

    return AuthUser(user_id=user_id, role=role, is_admin=is_admin)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    claims = decode_access_token(credentials.credentials)
    user = db.get(User, claims.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found or inactive')
    return user


def require_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required')
    return user


def require_admin(
    user: User = Depends(require_user),
) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return user


def enforce_uid(payload_uid: str, user: User | None) -> None:
    if user is not None and payload_uid != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='UID does not match access token')

    if settings.auth_required and user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required')
