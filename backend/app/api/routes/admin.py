from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.container import get_admin_service
from app.core.security import require_admin
from app.domain.schemas import (
    AdminAdjustBalanceIn,
    AdminAdjustBalanceOut,
    AdminAuditLogsOut,
    AdminUserOut,
    AdminUsersOut,
)
from app.models.entities import User
from app.services.admin_service import AdminService

router = APIRouter(tags=['admin'])


@router.get('/admin/users', response_model=AdminUsersOut)
def list_users(
    limit: int = Query(default=100, ge=1, le=200),
    _: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
) -> AdminUsersOut:
    return admin_service.list_users(limit=limit)


@router.get('/admin/users/{user_id}', response_model=AdminUserOut)
def get_user(
    user_id: str,
    _: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
) -> AdminUserOut:
    return admin_service.get_user(user_id)


@router.post('/admin/users/{user_id}/adjust-balance', response_model=AdminAdjustBalanceOut)
def adjust_balance(
    user_id: str,
    payload: AdminAdjustBalanceIn,
    admin_user: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
) -> AdminAdjustBalanceOut:
    return admin_service.adjust_balance(admin_user, user_id, payload)


@router.get('/admin/audit-logs', response_model=AdminAuditLogsOut)
def list_audit_logs(
    limit: int = Query(default=100, ge=1, le=200),
    _: User = Depends(require_admin),
    admin_service: AdminService = Depends(get_admin_service),
) -> AdminAuditLogsOut:
    return admin_service.get_audit_logs(limit=limit)
