from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.container import get_referral_service
from app.core.security import require_user
from app.domain.schemas import ReferralApplyIn, ReferralApplyOut, ReferralsOut
from app.models.entities import User
from app.services.referral_service import ReferralService

router = APIRouter(tags=['referrals'])


@router.get('/referrals/me', response_model=ReferralsOut)
def get_my_referrals(
    current_user: User = Depends(require_user),
    referral_service: ReferralService = Depends(get_referral_service),
) -> ReferralsOut:
    return referral_service.get_referrals(current_user)


@router.post('/referrals/apply', response_model=ReferralApplyOut)
def apply_referral(
    payload: ReferralApplyIn,
    current_user: User = Depends(require_user),
    referral_service: ReferralService = Depends(get_referral_service),
) -> ReferralApplyOut:
    return referral_service.apply(current_user, payload)
