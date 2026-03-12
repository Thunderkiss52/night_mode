from __future__ import annotations

from app.domain.schemas import (
    AdminAdjustBalanceIn,
    AdminAdjustBalanceOut,
    AdminAuditLogsOut,
    AdminUserOut,
    AdminUsersOut,
)
from app.infrastructure.repositories.night_repository import NightRepository
from app.models.entities import User


class AdminService:
    def __init__(self, repository: NightRepository) -> None:
        self.repository = repository

    def list_users(self, limit: int = 100) -> AdminUsersOut:
        return AdminUsersOut(items=self.repository.list_users(limit=limit))

    def get_user(self, user_id: str) -> AdminUserOut:
        return AdminUserOut(item=self.repository.get_admin_user(user_id))

    def adjust_balance(self, admin_user: User, target_user_id: str, payload: AdminAdjustBalanceIn) -> AdminAdjustBalanceOut:
        result = self.repository.admin_adjust_balance(
            admin_user_id=admin_user.id,
            target_user_id=target_user_id,
            amount=payload.amount,
            reason=payload.reason,
        )
        self.repository.commit()
        return result

    def get_audit_logs(self, limit: int = 100) -> AdminAuditLogsOut:
        return AdminAuditLogsOut(items=self.repository.list_audit_logs(limit=limit))
