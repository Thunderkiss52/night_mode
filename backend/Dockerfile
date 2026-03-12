FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /srv

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /srv/requirements.txt
RUN pip install --no-cache-dir -r /srv/requirements.txt

COPY backend/app /srv/app
COPY backend/alembic /srv/alembic
COPY backend/alembic.ini /srv/alembic.ini
COPY backend/entrypoint.sh /srv/entrypoint.sh
COPY backend/.env.example /srv/.env.example

RUN chmod +x /srv/entrypoint.sh

RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /srv
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["/srv/entrypoint.sh"]
