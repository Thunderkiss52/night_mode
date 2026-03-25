# Night Mode: Инструкция по деплою на VPS

Эта инструкция рассчитана на Ubuntu 22.04/24.04 и деплой через Docker Compose.

## 1. Что нужно заранее
- VPS с публичным IP
- Домен (например `econom.am`)
- Доступ по SSH
- Git-репозиторий с проектом
- PostgreSQL credentials
- Telegram bot token

## 2. Подготовка сервера

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

## 3. Клонирование проекта

```bash
sudo mkdir -p /opt/night_mode
sudo chown -R $USER:$USER /opt/night_mode
git clone <YOUR_GIT_REPO_URL> /opt/night_mode
cd /opt/night_mode
```

## 4. Создание env-файлов

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

## 5. Заполнение переменных

### 5.1 Файл `.env` (compose + frontend public vars)

```dotenv
POSTGRES_DB=night_mode
POSTGRES_USER=night_mode
POSTGRES_PASSWORD=<STRONG_DB_PASSWORD>
POSTGRES_HOST_BIND=127.0.0.1
POSTGRES_HOST_PORT=5434

BACKEND_HOST_BIND=127.0.0.1
BACKEND_HOST_PORT=8000

GATEWAY_HOST_BIND=0.0.0.0
GATEWAY_HOST_PORT=80

NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=...
```

Примечание: для single-host через nginx gateway оставляйте `NEXT_PUBLIC_API_BASE_URL` пустым.

### 5.2 Файл `backend/.env` (секреты backend)

```dotenv
APP_NAME=Night Mode API
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=8000
CORS_ORIGINS=https://econom.am

AUTH_MODE=required
DATABASE_URL=postgresql+psycopg://night_mode:<PASSWORD>@db:5432/night_mode
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=30
TELEGRAM_BOT_TOKEN=<BOT_TOKEN>
TELEGRAM_BOT_USERNAME=<BOT_USERNAME>
TELEGRAM_WEBAPP_URL=https://econom.am/competitions
```

## 6. Первый запуск

```bash
cd /opt/night_mode
docker compose up --build -d
docker compose ps
```

Проверка:

```bash
curl http://127.0.0.1/health
docker compose logs -f backend
```

## 7. Открытие портов (UFW)

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 8. HTTPS

Compose теперь поднимает gateway на `:80` и `:443` через Caddy и сам получает/обновляет Let's Encrypt сертификат для `econom.am`.

Что нужно для выпуска сертификата:

1. DNS `A`/`AAAA` запись домена `econom.am` должна указывать на сервер.
2. На сервере должны быть открыты `80/tcp` и `443/tcp`.
3. Достаточно обычного запуска стека:

```bash
docker compose up --build -d
docker compose logs -f gateway
```

При первом старте Caddy сам выпустит сертификат и начнет обслуживать `https://econom.am`.

## 9. Обновление приложения

```bash
cd /opt/night_mode
git pull --ff-only
docker compose up --build -d
docker image prune -f
```

## 10. Откат на предыдущий коммит

```bash
cd /opt/night_mode
git log --oneline -n 5
git checkout <PREVIOUS_COMMIT>
docker compose up --build -d
```

## 11. Диагностика

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
docker compose logs --tail=200 gateway
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/health
```

## 12. Базовый hardening checklist
- `APP_ENV=production`
- `AUTH_MODE=required`
- Сильный `JWT_SECRET` (не меньше 32 символов)
- Сильный пароль PostgreSQL
- Точный `CORS_ORIGINS` (только ваш домен)
- Не хранить секреты в git
- Регулярная ротация Telegram bot token и refresh sessions

## 13. Автозапуск после перезагрузки

```bash
docker compose up -d
```

Чтобы не делать вручную, можно добавить systemd unit:

```ini
# /etc/systemd/system/night-mode.service
[Unit]
Description=Night Mode Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=/opt/night_mode
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable night-mode
sudo systemctl start night-mode
```
