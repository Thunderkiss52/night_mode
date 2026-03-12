from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.container import get_wallet_service
from app.core.security import require_user
from app.domain.schemas import BalanceOut, DailyBonusOut, WalletTransactionsOut
from app.models.entities import User
from app.services.wallet_service import WalletService

router = APIRouter(tags=['wallet'])


@router.get('/wallet/balance', response_model=BalanceOut)
def get_wallet_balance(
    current_user: User = Depends(require_user),
    wallet_service: WalletService = Depends(get_wallet_service),
) -> BalanceOut:
    return wallet_service.get_balance(current_user)


@router.get('/wallet/transactions', response_model=WalletTransactionsOut)
def get_wallet_transactions(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_user),
    wallet_service: WalletService = Depends(get_wallet_service),
) -> WalletTransactionsOut:
    return wallet_service.get_transactions(current_user, limit=limit)


@router.post('/wallet/daily-bonus', response_model=DailyBonusOut)
def claim_daily_bonus(
    current_user: User = Depends(require_user),
    wallet_service: WalletService = Depends(get_wallet_service),
) -> DailyBonusOut:
    return wallet_service.claim_daily_bonus(current_user)
