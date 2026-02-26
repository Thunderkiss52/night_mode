# Night Mode FastAPI backend

## Structure
- `app/core`: config, security, DI container
- `app/domain`: schemas
- `app/infrastructure`: firebase adapter, repositories, in-memory store
- `app/services`: business logic
- `app/api`: http routes

## Local run
1. `cd backend`
2. `python3 -m venv .venv`
3. `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `cp .env.example .env`
6. `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

Swagger UI: `http://localhost:8000/docs`

## Auth flow
1. Client gets Firebase ID token from Firebase Auth.
2. Call `POST /api/auth/firebase-login`.
3. API returns JWT access token.
4. Send `Authorization: Bearer <token>` on write endpoints.

## Endpoints
- `GET /health`
- `POST /api/auth/firebase-login`
- `POST /api/auth/dev-login` (dev only)
- `GET /api/auth/me`
- `GET /api/locations`
- `POST /api/locations`
- `GET /api/competitions/city-ranking`
- `POST /api/qr/bind`

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
