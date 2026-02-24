from __future__ import annotations

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import AuthUser, create_access_token
from app.domain.schemas import AuthTokenOut
from app.infrastructure.firebase_admin import verify_firebase_token


class AuthService:
    def firebase_login(self, firebase_id_token: str) -> AuthTokenOut:
        claims = verify_firebase_token(firebase_id_token)
        if claims is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid Firebase ID token or Firebase Admin is not configured',
            )

        uid = str(claims.get('uid', '')).strip()
        if not uid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Firebase token missing uid')

        email = claims.get('email')
        if email is not None:
            email = str(email)

        access_token, expires_in = create_access_token(uid=uid, email=email)
        return AuthTokenOut(access_token=access_token, expires_in=expires_in, uid=uid, email=email)

    def dev_login(self, uid: str, email: str | None = None) -> AuthTokenOut:
        if settings.app_env.lower() != 'dev':
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Dev login disabled outside dev env')

        access_token, expires_in = create_access_token(uid=uid, email=email)
        return AuthTokenOut(access_token=access_token, expires_in=expires_in, uid=uid, email=email)

    def me(self, user: AuthUser) -> AuthUser:
        return user
