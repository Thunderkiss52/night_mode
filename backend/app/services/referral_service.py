from __future__ import annotations

from app.domain.schemas import ReferralApplyIn, ReferralApplyOut, ReferralsOut
from app.infrastructure.repositories.night_repository import NightRepository
from app.models.entities import User


class ReferralService:
    def __init__(self, repository: NightRepository) -> None:
        self.repository = repository

    def get_referrals(self, user: User) -> ReferralsOut:
        return self.repository.get_referral_stats(user.id)

    def apply(self, user: User, payload: ReferralApplyIn) -> ReferralApplyOut:
        result = self.repository.apply_referral(
            user_id=user.id,
            referral_code=payload.referral_code,
            referrer_telegram_id=payload.referrer_telegram_id,
            source='manual_apply',
        )
        self.repository.commit()
        return result
