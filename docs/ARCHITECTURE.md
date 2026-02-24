# Architecture

## Overview
- `app/`: Next.js UI (presentation layer)
- `backend/app/core`: configuration, security, DI container
- `backend/app/domain`: request/response and domain schemas
- `backend/app/infrastructure`: Firebase adapter + repositories + in-memory store
- `backend/app/services`: application/business orchestration
- `backend/app/api`: FastAPI routes and root router

## Request flow
1. Route validates payload via `domain/schemas.py`.
2. Route delegates to `services/*`.
3. Service delegates to `infrastructure/repositories/*`.
4. Repository uses Firestore if available, otherwise in-memory fallback.

## Auth flow
1. Client authenticates with Firebase Auth.
2. Client sends Firebase ID token to `/api/auth/firebase-login`.
3. Backend verifies Firebase token via Firebase Admin.
4. Backend issues short-lived JWT for API writes.

## Deployment topology
- Option A (recommended): split deploy
  - frontend: Vercel/Render static node service
  - backend: Render/Railway/Fly
- Option B: single host with Docker Compose + Nginx gateway
