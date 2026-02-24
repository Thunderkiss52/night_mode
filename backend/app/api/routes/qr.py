from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.container import get_night_service
from app.core.security import enforce_uid, get_current_user_optional
from app.domain.schemas import QrBindIn, QrBindOut
from app.services.night_service import NightService

router = APIRouter(prefix='/api/qr', tags=['qr'])


@router.post('/bind', response_model=QrBindOut)
def bind_qr(
    payload: QrBindIn,
    current_user=Depends(get_current_user_optional),
    night_service: NightService = Depends(get_night_service),
) -> QrBindOut:
    enforce_uid(payload.uid, current_user)

    ok, message, secure_hash = night_service.bind_qr(payload)
    if not ok and message == 'QR format invalid':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return QrBindOut(
        ok=ok,
        message=message,
        qr_id=payload.qr_id.strip().upper() if ok else None,
        secure_hash=secure_hash,
    )
