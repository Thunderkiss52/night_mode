from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _as_bool(value: str, default: bool) -> bool:
    normalized = value.strip().lower()
    if normalized in {'1', 'true', 'yes', 'on'}:
        return True
    if normalized in {'0', 'false', 'no', 'off'}:
        return False
    return default


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv('APP_NAME', 'Night Mode API')
    app_env: str = os.getenv('APP_ENV', 'dev')
    app_host: str = os.getenv('APP_HOST', '0.0.0.0')
    app_port: int = int(os.getenv('APP_PORT', '8000'))
    app_version: str = os.getenv('APP_VERSION', '1.0.0')

    cors_origins_raw: str = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000'
    )

    database_url: str = os.getenv(
        'DATABASE_URL',
        'postgresql+psycopg://night_mode:night_mode@db:5432/night_mode'
    )

    auth_mode: str = os.getenv('AUTH_MODE', 'optional')
    jwt_secret: str = os.getenv('JWT_SECRET', 'change-me-night-mode-dev-secret')
    jwt_algorithm: str = os.getenv('JWT_ALGORITHM', 'HS256')
    jwt_expire_minutes: int = int(os.getenv('JWT_EXPIRE_MINUTES', '15'))
    jwt_refresh_expire_days: int = int(os.getenv('JWT_REFRESH_EXPIRE_DAYS', '30'))
    jwt_issuer: str = os.getenv('JWT_ISSUER', 'night-mode-api')
    jwt_audience: str = os.getenv('JWT_AUDIENCE', 'night-mode-client')
    refresh_cookie_name: str = os.getenv('REFRESH_COOKIE_NAME', 'nm_refresh_token')
    refresh_cookie_secure: bool = _as_bool(os.getenv('REFRESH_COOKIE_SECURE', 'false'), False)
    refresh_cookie_samesite: str = os.getenv('REFRESH_COOKIE_SAMESITE', 'lax')
    refresh_cookie_domain: str = os.getenv('REFRESH_COOKIE_DOMAIN', '')

    geocoder_primary: str = os.getenv('GEOCODER_PRIMARY', 'nominatim')
    geocoder_timeout_seconds: int = int(os.getenv('GEOCODER_TIMEOUT_SECONDS', '1'))

    nominatim_reverse_url: str = os.getenv(
        'NOMINATIM_REVERSE_URL',
        'https://nominatim.openstreetmap.org/reverse',
    )
    nominatim_api_key: str = os.getenv('NOMINATIM_API_KEY', '')
    nominatim_user_agent: str = os.getenv('NOMINATIM_USER_AGENT', 'night-mode-api/1.0')
    nominatim_email: str = os.getenv('NOMINATIM_EMAIL', '')

    yandex_geocoder_url: str = os.getenv(
        'YANDEX_GEOCODER_URL',
        'https://geocode-maps.yandex.ru/1.x/',
    )
    yandex_geocoder_api_key: str = os.getenv('YANDEX_GEOCODER_API_KEY', '')

    google_geocoder_url: str = os.getenv(
        'GOOGLE_GEOCODER_URL',
        'https://maps.googleapis.com/maps/api/geocode/json',
    )
    google_geocoder_api_key: str = os.getenv('GOOGLE_GEOCODER_API_KEY', '')

    telegram_bot_token: str = os.getenv('TELEGRAM_BOT_TOKEN', '')
    telegram_bot_username: str = os.getenv('TELEGRAM_BOT_USERNAME', '')
    telegram_webapp_url: str = os.getenv('TELEGRAM_WEBAPP_URL', '')
    telegram_webapp_title: str = os.getenv('TELEGRAM_WEBAPP_TITLE', 'NM Clicker')
    telegram_initdata_max_age_seconds: int = int(os.getenv('TELEGRAM_INITDATA_MAX_AGE_SECONDS', '86400'))

    clicker_max_taps_per_second: int = int(os.getenv('CLICKER_MAX_TAPS_PER_SECOND', '10'))
    clicker_referral_bonus_levels: int = int(os.getenv('CLICKER_REFERRAL_BONUS_LEVELS', '3'))
    clicker_daily_bonus_per_level: int = int(os.getenv('CLICKER_DAILY_BONUS_PER_LEVEL', '1000'))
    clicker_admin_token: str = os.getenv('CLICKER_ADMIN_TOKEN', '')
    referral_bonus_referrer: int = int(os.getenv('REFERRAL_BONUS_REFERRER', '3000'))
    referral_bonus_referred: int = int(os.getenv('REFERRAL_BONUS_REFERRED', '1000'))
    admin_password_auth_enabled: bool = _as_bool(os.getenv('ADMIN_PASSWORD_AUTH_ENABLED', 'false'), False)

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins_raw.split(',') if item.strip()]

    @property
    def auth_required(self) -> bool:
        return self.auth_mode.strip().lower() == 'required'


settings = Settings()
