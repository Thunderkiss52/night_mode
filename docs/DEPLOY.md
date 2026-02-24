# Deployment

## Option A: Split services

### Backend (Render/Railway/Fly)
1. Deploy `backend/Dockerfile`.
2. Set env vars:
   - `APP_ENV=production`
   - `AUTH_MODE=required`
   - `JWT_SECRET=<strong-secret>`
   - `USE_FIREBASE=true`
   - `FIREBASE_PROJECT_ID=<id>`
   - `FIREBASE_SERVICE_ACCOUNT_JSON=<json>`
3. Verify `/health` and `/docs`.

### Frontend (Vercel/Render)
1. Deploy project root.
2. Set `NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>`.
3. Set all `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
4. Verify pages: map/profile/qr/competitions.

## Option B: Single VPS with Docker Compose
1. Copy env templates:
   - `cp .env.deploy.example .env`
   - `cp backend/.env.example backend/.env`
2. Fill `.env` (frontend public vars) and `backend/.env` (JWT/Firebase secrets).
3. Run:
   - `docker compose up --build -d`
4. Open `http://<server-ip>`.

## Production checklist
- Disable `dev-login` by setting `APP_ENV=production`.
- Use strong `JWT_SECRET`.
- Restrict `CORS_ORIGINS` to your domains.
- Rotate Firebase service account keys periodically.
