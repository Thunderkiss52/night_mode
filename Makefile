.PHONY: dev-web dev-api typecheck api-compile docker-up docker-down

dev-web:
	npm run dev:web

dev-api:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

typecheck:
	npm run typecheck

api-compile:
	python3 -m compileall backend/app

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
