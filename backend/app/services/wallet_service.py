from __future__ import annotations

from app.domain.schemas import BalanceOut, DailyBonusOut, WalletTransactionsOut
from app.infrastructure.repositories.night_repository import NightRepository
from app.models.entities import User


class WalletService:
    def __init__(self, repository: NightRepository) -> None:
        self.repository = repository

    def get_balance(self, user: User) -> BalanceOut:
        balance = self.repository.get_balance(user.id)
        return BalanceOut(balance=balance.balance, updated_at=balance.updated_at)

    def get_transactions(self, user: User, limit: int = 50) -> WalletTransactionsOut:
        return WalletTransactionsOut(items=self.repository.list_transactions(user.id, limit=limit))

    def claim_daily_bonus(self, user: User) -> DailyBonusOut:
        ok, reward_date, amount, message, balance = self.repository.claim_daily_bonus(user.id)
        self.repository.commit()
        return DailyBonusOut(
            ok=ok,
            added_amount=amount,
            balance=balance.balance,
            reward_date=reward_date,
            message=message,
        )
