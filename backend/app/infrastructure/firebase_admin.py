from __future__ import annotations

import json
from typing import Any

from app.core.config import settings

try:
    import firebase_admin
    from firebase_admin import auth, credentials, firestore
except Exception:  # pragma: no cover
    firebase_admin = None
    auth = None
    credentials = None
    firestore = None


def _build_credential() -> Any | None:
    if credentials is None:
        return None

    if settings.firebase_service_account_json:
        try:
            info = json.loads(settings.firebase_service_account_json)
            return credentials.Certificate(info)
        except Exception:
            return None

    if settings.firebase_service_account_file:
        try:
            return credentials.Certificate(settings.firebase_service_account_file)
        except Exception:
            return None

    return None


def init_firebase() -> bool:
    if not settings.use_firebase or firebase_admin is None:
        return False

    if firebase_admin._apps:  # type: ignore[attr-defined]
        return True

    credential = _build_credential()
    options: dict[str, str] = {}
    if settings.firebase_project_id:
        options['projectId'] = settings.firebase_project_id

    try:
        if credential is not None:
            firebase_admin.initialize_app(credential=credential, options=options or None)
        else:
            firebase_admin.initialize_app(options=options or None)
        return True
    except Exception:
        return False


def get_firestore_client() -> Any | None:
    if not init_firebase() or firestore is None:
        return None

    try:
        return firestore.client()
    except Exception:
        return None


def verify_firebase_token(id_token: str) -> dict[str, Any] | None:
    if not init_firebase() or auth is None:
        return None

    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception:
        return None
