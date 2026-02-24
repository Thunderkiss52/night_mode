# Night Mode MVP

MVP-платформа бренда одежды Night Mode: карта пользователей, профили, QR-привязка мерча, соревнования и i18n.

## Архитектура
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind
- Backend: FastAPI (Clean Architecture)
- Data/Auth: Firebase Auth + Firebase Admin + Firestore
- Deployment: Docker (frontend/backend/nginx), Render blueprint

Подробно: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Структура проекта
- `app`, `components`, `lib`: UI и frontend слой
- `backend/app/core`: конфиг, JWT security, DI container
- `backend/app/domain`: схемы и контракты
- `backend/app/infrastructure`: firebase и репозитории
- `backend/app/services`: бизнес-логика
- `backend/app/api`: HTTP роуты
- `infra/nginx`: gateway конфиг

## Локальный запуск (split mode)

### Frontend
1. `npm install`
2. `cp .env.example .env.local`
3. Заполните `.env.local`
4. `npm run dev:web`

### Backend
1. `cd backend`
2. `python3 -m venv .venv`
3. `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `cp .env.example .env`
6. `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

## Локальный запуск (single host Docker)
1. `cp .env.deploy.example .env`
2. `cp backend/.env.example backend/.env`
3. Заполните `.env` (frontend public vars) и `backend/.env` (backend secrets)
4. `docker compose up --build -d`
5. Откройте `http://localhost`

## Переменные окружения
Frontend `.env.local`:
- `NEXT_PUBLIC_API_BASE_URL=`
- `NEXT_PUBLIC_FIREBASE_*`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Backend `.env`:
- `AUTH_MODE=required`
- `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`
- `USE_FIREBASE=true`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_FILE` или `FIREBASE_SERVICE_ACCOUNT_JSON`

## API endpoints
- `GET /health`
- `POST /api/auth/firebase-login`
- `POST /api/auth/dev-login` (dev only)
- `GET /api/auth/me`
- `GET /api/locations`
- `POST /api/locations`
- `GET /api/competitions/city-ranking`
- `POST /api/qr/bind`

## Деплой
- Docker Compose: [docker-compose.yml](docker-compose.yml)
- Render blueprint: [render.yaml](render.yaml)
- Full guide: [docs/DEPLOY.md](docs/DEPLOY.md)

## Команды
- `npm run dev:web`
- `npm run dev:api`
- `npm run docker:up`
- `npm run docker:down`
