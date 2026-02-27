from __future__ import annotations

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.clicker import router as clicker_router
from app.api.routes.competitions import router as competitions_router
from app.api.routes.health import router as health_router
from app.api.routes.locations import router as locations_router
from app.api.routes.qr import router as qr_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(locations_router)
api_router.include_router(competitions_router)
api_router.include_router(clicker_router)
api_router.include_router(qr_router)
