# Deployment

## Option A: Split services

### Backend (Render/Railway/Fly)
1. Deploy `backend/Dockerfile`.
2. Set env vars:
   - `APP_ENV=production`
   - `AUTH_MODE=required`
   - `DATABASE_URL=postgresql+psycopg://...`
   - `JWT_SECRET=<strong-secret>`
   - `JWT_REFRESH_EXPIRE_DAYS=30`
   - `TELEGRAM_BOT_TOKEN=<bot-token>`
3. Verify `/health` and `/docs`.

### Frontend (Vercel/Render)
1. Deploy `frontend/` or use `frontend/Dockerfile`.
2. Set `NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>`.
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
4. Verify pages: map/profile/qr/competitions.

## Option B: Single VPS with Docker Compose
1. Copy env templates:
   - `cp .env.example .env`
   - `cp backend/.env.example backend/.env`
2. Fill `.env` (compose/public vars) and `backend/.env` (JWT/PostgreSQL/Telegram secrets).
3. Run:
   - `docker compose up --build -d`
4. Open `http://<server-ip>`.

## Production checklist
- Use strong `JWT_SECRET`.
- Use strong PostgreSQL password.
- Keep `POSTGRES_HOST_BIND=127.0.0.1` and `BACKEND_HOST_BIND=127.0.0.1` unless you explicitly need external access.
- Restrict `CORS_ORIGINS` to your domains.
- Rotate Telegram bot token and refresh sessions when needed.
