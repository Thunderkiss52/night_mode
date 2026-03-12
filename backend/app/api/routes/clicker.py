from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import settings
from app.core.container import get_night_service
from app.core.security import require_user
from app.domain.schemas import (
    AuthTelegramIn,
    ClickerAuthOut,
    ClickerDailyBonusOut,
    ClickerLeaderboardOut,
    ClickerLotteryAdminOut,
    ClickerLotteryOut,
    ClickerReferralOut,
    ClickerStateOut,
    ClickerTapIn,
    ClickerTapOut,
    ReferralApplyIn,
)
from app.models.entities import User
from app.services.night_service import NightService

router = APIRouter(prefix='/api/clicker', tags=['clicker'])


@router.post('/auth/telegram', response_model=ClickerAuthOut)
def clicker_auth_telegram(
    payload: AuthTelegramIn,
    night_service: NightService = Depends(get_night_service),
) -> ClickerAuthOut:
    access_token, expires_in, uid, start_param, state = night_service.clicker_auth_telegram(
        init_data=payload.init_data,
        dev_telegram_user_id=payload.dev_telegram_user_id,
        username=payload.username,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    return ClickerAuthOut(
        access_token=access_token,
        expires_in=expires_in,
        uid=uid,
        start_param=start_param,
        state=state,
    )


@router.get('/state', response_model=ClickerStateOut)
def clicker_state(
    current_user: User = Depends(require_user),
    night_service: NightService = Depends(get_night_service),
) -> ClickerStateOut:
    return ClickerStateOut(state=night_service.get_clicker_state(current_user.id))


@router.post('/tap', response_model=ClickerTapOut)
def clicker_tap(
    payload: ClickerTapIn,
    current_user: User = Depends(require_user),
    night_service: NightService = Depends(get_night_service),
) -> ClickerTapOut:
    ok, accepted_taps, rejected_taps, added_points, throttled, message, state = night_service.tap_clicker(
        uid=current_user.id,
        taps=payload.taps,
    )
    return ClickerTapOut(
        ok=ok,
        accepted_taps=accepted_taps,
        rejected_taps=rejected_taps,
        added_points=added_points,
        throttled=throttled,
        message=message,
        state=state,
    )


@router.post('/daily-bonus', response_model=ClickerDailyBonusOut)
def clicker_daily_bonus(
    current_user: User = Depends(require_user),
    night_service: NightService = Depends(get_night_service),
) -> ClickerDailyBonusOut:
    ok, added_points, message, state = night_service.claim_daily_bonus(uid=current_user.id)
    return ClickerDailyBonusOut(ok=ok, added_points=added_points, message=message, state=state)


@router.post('/referral/apply', response_model=ClickerReferralOut)
def clicker_apply_referral(
    payload: ReferralApplyIn,
    current_user: User = Depends(require_user),
    night_service: NightService = Depends(get_night_service),
) -> ClickerReferralOut:
    if payload.referrer_telegram_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='referrer_telegram_id is required')
    ok, message, state = night_service.apply_referral(
        uid=current_user.id,
        referrer_telegram_id=payload.referrer_telegram_id,
    )
    return ClickerReferralOut(ok=ok, message=message, state=state)


@router.get('/leaderboard', response_model=ClickerLeaderboardOut)
def clicker_leaderboard(
    limit: int = Query(default=50, ge=1, le=50),
    night_service: NightService = Depends(get_night_service),
) -> ClickerLeaderboardOut:
    items = night_service.clicker_leaderboard(limit=limit)
    return ClickerLeaderboardOut(items=items, updated_at=datetime.now(timezone.utc))


@router.post('/lottery/enter', response_model=ClickerLotteryOut)
def clicker_enter_lottery(
    current_user: User = Depends(require_user),
    night_service: NightService = Depends(get_night_service),
) -> ClickerLotteryOut:
    ok, message, entered_at, state = night_service.enter_lottery(uid=current_user.id)
    return ClickerLotteryOut(ok=ok, message=message, entered_at=entered_at, state=state)


@router.get('/admin/lottery', response_model=ClickerLotteryAdminOut)
def clicker_admin_lottery(
    token: str | None = Query(default=None),
    night_service: NightService = Depends(get_night_service),
) -> ClickerLotteryAdminOut:
    expected = settings.clicker_admin_token.strip()
    if expected and token != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid admin token')
    return ClickerLotteryAdminOut(entries=night_service.list_lottery_entries())
