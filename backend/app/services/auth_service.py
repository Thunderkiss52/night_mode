from __future__ import annotations

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token
from app.core.telegram_webapp import TelegramInitDataError, verify_telegram_init_data
from app.domain.schemas import (
    AccessTokenOut,
    AuthTelegramIn,
    AuthTokenOut,
    CurrentUserOut,
)
from app.infrastructure.repositories.night_repository import NightRepository
from app.models.entities import User


class AuthService:
    def __init__(self, repository: NightRepository) -> None:
        self.repository = repository

    def _parse_telegram_auth(self, payload: AuthTelegramIn):
        if payload.init_data:
            try:
                tg_user = verify_telegram_init_data(
                    init_data=payload.init_data,
                    bot_token=settings.telegram_bot_token,
                    max_age_seconds=settings.telegram_initdata_max_age_seconds,
                )
            except TelegramInitDataError as exc:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

            return {
                'telegram_user_id': tg_user.telegram_user_id,
                'username': tg_user.username,
                'first_name': tg_user.first_name,
                'last_name': tg_user.last_name,
                'photo_url': payload.photo_url,
                'language_code': payload.language_code,
                'start_param': tg_user.start_param,
            }

        if settings.app_env.lower() == 'production':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='init_data is required in production')
        if payload.dev_telegram_user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Provide init_data or dev_telegram_user_id in non-production mode',
            )

        return {
            'telegram_user_id': payload.dev_telegram_user_id,
            'username': payload.username,
            'first_name': payload.first_name,
            'last_name': payload.last_name,
            'photo_url': payload.photo_url,
            'language_code': payload.language_code,
            'start_param': payload.referral_code,
        }

    def telegram_login(
        self,
        payload: AuthTelegramIn,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthTokenOut:
        tg_data = self._parse_telegram_auth(payload)
        referral_code = payload.referral_code or tg_data['start_param']

        user, _ = self.repository.upsert_telegram_user(
            telegram_user_id=tg_data['telegram_user_id'],
            username=tg_data['username'],
            first_name=tg_data['first_name'],
            last_name=tg_data['last_name'],
            photo_url=tg_data['photo_url'],
            language_code=tg_data['language_code'],
        )

        if referral_code:
            self.repository.apply_referral(
                user_id=user.id,
                referral_code=referral_code,
                source='telegram_auth',
            )

        refresh_token, refresh_expires_in = self.repository.create_refresh_session(
            user_id=user.id,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        access_token, expires_in = create_access_token(
            user_id=user.id,
            role=user.role,
            is_admin=user.is_admin,
        )
        self.repository.commit()

        return AuthTokenOut(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            refresh_expires_in=refresh_expires_in,
            user=self.repository.build_user_profile(user),
        )

    def refresh(
        self,
        refresh_token: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AccessTokenOut:
        user, new_refresh_token, refresh_expires_in = self.repository.rotate_refresh_session(
            refresh_token=refresh_token,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        access_token, expires_in = create_access_token(
            user_id=user.id,
            role=user.role,
            is_admin=user.is_admin,
        )
        self.repository.commit()
        return AccessTokenOut(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=expires_in,
            refresh_expires_in=refresh_expires_in,
        )

    def logout(self, refresh_token: str | None, session_id: str | None, user: User | None = None) -> None:
        self.repository.revoke_refresh_session(
            refresh_token=refresh_token,
            session_id=session_id,
            user_id=user.id if user is not None else None,
        )
        self.repository.commit()

    def me(self, user: User) -> CurrentUserOut:
        return CurrentUserOut(user=self.repository.build_user_profile(user))
