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

    cors_origins_raw: str = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000'
    )

    auth_mode: str = os.getenv('AUTH_MODE', 'optional')
    jwt_secret: str = os.getenv('JWT_SECRET', 'change-me-night-mode-dev-secret')
    jwt_algorithm: str = os.getenv('JWT_ALGORITHM', 'HS256')
    jwt_expire_minutes: int = int(os.getenv('JWT_EXPIRE_MINUTES', '120'))

    use_firebase: bool = _as_bool(os.getenv('USE_FIREBASE', 'true'), True)
    firebase_project_id: str = os.getenv('FIREBASE_PROJECT_ID', '')
    firebase_service_account_file: str = os.getenv('FIREBASE_SERVICE_ACCOUNT_FILE', '')
    firebase_service_account_json: str = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON', '')

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

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins_raw.split(',') if item.strip()]

    @property
    def auth_required(self) -> bool:
        return self.auth_mode.strip().lower() == 'required'


settings = Settings()
