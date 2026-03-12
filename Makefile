.PHONY: dev-web dev-api dev-bot typecheck api-compile docker-up docker-down deploy-init

dev-web:
	cd frontend && npm run dev:web

dev-api:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-bot:
	cd backend && python3 -m app.bot.main

typecheck:
	cd frontend && npm run typecheck

api-compile:
	python3 -m compileall backend/app

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

deploy-init:
	test -f .env || cp .env.example .env
	test -f backend/.env || cp backend/.env.example backend/.env
