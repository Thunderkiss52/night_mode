# Night Mode FastAPI backend

## Structure
- `app/core`: config, security, DI container
- `app/domain`: schemas
- `app/models`: SQLAlchemy models
- `app/infrastructure`: repositories и вспомогательные store-утилиты
- `alembic`: миграции PostgreSQL
- `app/services`: business logic
- `app/api`: http routes
- `app/bot`: Telegram bot (polling, referral deep links, Mini App button)

## Local run
1. `cd backend`
2. `python3 -m venv .venv`
3. `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `cp .env.example .env`
6. `alembic upgrade head`
7. `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

Swagger UI: `http://localhost:8000/docs`

## Telegram bot run
1. Fill env vars in `backend/.env`:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME` (without `@`)
   - `TELEGRAM_WEBAPP_URL` (Mini App URL)
2. Run polling bot:
   - `python -m app.bot.main`

Bot commands:
- `/start` opens Mini App button and applies `ref_<telegram_user_id>` payload.
- `/ref` returns referral link.
- `/help` lists commands.

## Auth flow
1. Client gets `window.Telegram.WebApp.initData`.
2. Call `POST /auth/telegram`.
3. Backend validates Telegram signature and upserts user in PostgreSQL.
4. API returns JWT access token and refresh token.
5. Send `Authorization: Bearer <token>` on protected endpoints.

## Endpoints
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
- `GET /api/clicker/leaderboard?limit=50`
- `POST /api/clicker/lottery/enter`
- `GET /api/clicker/admin/lottery?token=<CLICKER_ADMIN_TOKEN>`

## Reverse geocoder fallback
- `POST /api/locations` tries to auto-fill `city/country` when payload contains placeholders (for example `Unknown` or `Custom point`).
- Provider order is controlled by `GEOCODER_PRIMARY` and fallback chain includes: Nominatim, Yandex Geocoder, Google Geocoding API.
- Configure API keys in `.env`:
  - `GEOCODER_TIMEOUT_SECONDS` (default `1`)
  - `NOMINATIM_API_KEY` (optional, if your Nominatim provider requires it)
  - `YANDEX_GEOCODER_API_KEY`
  - `GOOGLE_GEOCODER_API_KEY`

## Docker
- Build: `docker build -f backend/Dockerfile -t night-mode-api .`
- Run: `docker run -p 8000:8000 --env-file backend/.env.example night-mode-api`

## Clicker env
- `TELEGRAM_BOT_TOKEN` (required for Telegram initData auth)
- `TELEGRAM_BOT_USERNAME` (used in referral links)
- `TELEGRAM_WEBAPP_URL` (Mini App URL)
- `TELEGRAM_WEBAPP_TITLE` (menu button title)
- `TELEGRAM_INITDATA_MAX_AGE_SECONDS` (default `86400`)
- `CLICKER_MAX_TAPS_PER_SECOND` (default `10`)
- `CLICKER_REFERRAL_BONUS_LEVELS` (default `3`)
- `CLICKER_DAILY_BONUS_PER_LEVEL` (default `1000`)
- `CLICKER_ADMIN_TOKEN` (optional, required in production for admin lottery endpoint)
