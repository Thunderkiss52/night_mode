# Architecture

## Overview
- `frontend/app/`: Next.js UI (presentation layer)
- `backend/app/core`: configuration, security, DI container
- `backend/app/domain`: request/response and domain schemas
- `backend/app/models`: SQLAlchemy models
- `backend/app/infrastructure`: repositories + helper store utilities
- `backend/app/services`: application/business orchestration
- `backend/app/api`: FastAPI routes and root router
- `backend/app/bot`: Telegram bot entrypoint and referral deep-link handling
- `backend/alembic`: PostgreSQL migrations

## Request flow
1. Route validates payload via `domain/schemas.py`.
2. Route delegates to `services/*`.
3. Service delegates to `infrastructure/repositories/*`.
4. Repository works with PostgreSQL through SQLAlchemy session.

## Auth flow
1. Client gets Telegram Mini App `initData`.
2. Client sends `initData` to `/auth/telegram`.
3. Backend validates Telegram HMAC signature and checks `auth_date`.
4. Backend upserts user/session in PostgreSQL and issues access/refresh tokens.

## Clicker flow
1. Telegram Mini App sends `initData` to `POST /api/clicker/auth/telegram`.
2. Backend validates HMAC signature using bot token.
3. Backend upserts PostgreSQL user, issues JWT, returns state.
4. Client uses JWT for tap/daily bonus/referral/lottery endpoints.
5. Leaderboard is built from PostgreSQL balances.

## Deployment topology
- Option A (recommended): split deploy
  - frontend: Vercel/Render static node service
  - backend: Render/Railway/Fly with PostgreSQL
- Option B: single host with Docker Compose + Nginx gateway
