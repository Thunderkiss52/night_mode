# Night Mode MVP

MVP-платформа бренда одежды Night Mode: карта пользователей, профили, QR-привязка мерча, соревнования и i18n.

## Архитектура
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind
- Backend: FastAPI + SQLAlchemy 2.x + Alembic
- Data/Auth: PostgreSQL + backend JWT + Telegram Mini App auth
- Deployment: Docker Compose (frontend/backend/db/nginx)

Подробно: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Структура проекта
- `frontend/app`, `frontend/components`, `frontend/lib`: UI и frontend слой
- `backend/app/core`: конфиг, JWT security, DI container
- `backend/app/domain`: схемы и контракты
- `backend/app/infrastructure`: репозитории и вспомогательные store-утилиты
- `backend/app/services`: бизнес-логика
- `backend/app/api`: HTTP роуты
- `infra/nginx`: gateway конфиг

## Локальный запуск (split mode)

### Frontend
1. `cd frontend`
2. `npm install`
3. `cp .env.example .env.local`
4. Заполните `.env.local`
5. `npm run dev:web`

### Backend
1. `cd backend`
2. `python3 -m venv .venv`
3. `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `cp .env.example .env`
6. `alembic upgrade head`
7. `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## Локальный запуск (single host Docker)
1. `make deploy-init`
2. Заполните `.env` (compose/public vars) и `backend/.env` (PostgreSQL/JWT/Telegram secrets)
3. `docker compose up --build -d`
4. Откройте `http://localhost`

## Переменные окружения
Root `.env` для Docker Compose:
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `POSTGRES_HOST_BIND=127.0.0.1`
- `POSTGRES_HOST_PORT=5434`
- `BACKEND_HOST_BIND=127.0.0.1`
- `BACKEND_HOST_PORT=8000`
- `GATEWAY_HOST_BIND=0.0.0.0`
- `GATEWAY_HOST_PORT=80`
- `NEXT_PUBLIC_API_BASE_URL=`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=`

Frontend `.env.local`:
- `NEXT_PUBLIC_API_BASE_URL=`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=`

Backend `.env`:
- `DATABASE_URL`
- `AUTH_MODE=required`
- `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`, `JWT_REFRESH_EXPIRE_DAYS`
- `GEOCODER_PRIMARY` (`nominatim` | `yandex` | `google`)
- `NOMINATIM_API_KEY` / `YANDEX_GEOCODER_API_KEY` / `GOOGLE_GEOCODER_API_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_WEBAPP_URL` (`https://<domain>/ru/competitions`), `TELEGRAM_WEBAPP_TITLE`
- `TELEGRAM_INITDATA_MAX_AGE_SECONDS`
- `CLICKER_MAX_TAPS_PER_SECOND`, `CLICKER_REFERRAL_BONUS_LEVELS`, `CLICKER_DAILY_BONUS_PER_LEVEL`
- `CLICKER_ADMIN_TOKEN`

## API endpoints
- `GET /health`
- `POST /auth/telegram`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /users/me/profile`
- `PATCH /users/me/profile`
- `GET /wallet/balance`
- `GET /wallet/transactions`
- `POST /wallet/daily-bonus`
- `GET /referrals/me`
- `POST /referrals/apply`
- `GET /competitions`
- `GET /competitions/{id}`
- `GET /competitions/{id}/leaderboard`
- `GET /admin/users`
- `GET /admin/users/{id}`
- `POST /admin/users/{id}/adjust-balance`
- `GET /admin/audit-logs`
- `GET /api/locations`
- `POST /api/locations`
- `GET /api/competitions/city-ranking`
- `POST /api/qr/bind`
- `POST /api/clicker/auth/telegram`
- `GET /api/clicker/state`
- `POST /api/clicker/tap`
- `POST /api/clicker/daily-bonus`
- `POST /api/clicker/referral/apply`
- `GET /api/clicker/leaderboard`
- `POST /api/clicker/lottery/enter`
- `GET /api/clicker/admin/lottery`

## Деплой
- Docker Compose: [docker-compose.yml](docker-compose.yml)
- Compose env template: [.env.example](.env.example)
- Render blueprint: [render.yaml](render.yaml)
- Full guide: [docs/DEPLOY.md](docs/DEPLOY.md)
- Smoke checklist: [docs/SMOKE_CHECKLIST.md](docs/SMOKE_CHECKLIST.md)

## Команды
- `make dev-web`
- `make dev-api`
- `make dev-bot`
- `make docker-up`
- `make docker-down`
