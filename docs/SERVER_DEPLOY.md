# Night Mode: Инструкция по деплою на VPS

Эта инструкция рассчитана на Ubuntu 22.04/24.04 и деплой через Docker Compose.

## 1. Что нужно заранее
- VPS с публичным IP
- Домен (например `nightmode.example.com`)
- Доступ по SSH
- Git-репозиторий с проектом
- Firebase проект и ключи (`NEXT_PUBLIC_FIREBASE_*`, service account)

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
cp .env.deploy.example .env
cp backend/.env.example backend/.env
```

## 5. Заполнение переменных

### 5.1 Файл `.env` (frontend build args)

```dotenv
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

Примечание: для single-host через nginx gateway оставляйте `NEXT_PUBLIC_API_BASE_URL` пустым.

### 5.2 Файл `backend/.env` (секреты backend)

```dotenv
APP_NAME=Night Mode API
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=8000
CORS_ORIGINS=https://nightmode.example.com

AUTH_MODE=required
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=120

USE_FIREBASE=true
FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_FILE=
FIREBASE_SERVICE_ACCOUNT_JSON={...json...}
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

## 8. HTTPS (рекомендуется)

Текущий compose использует nginx на `:80`. Для SSL есть два варианта:

1. Поставить Caddy/Nginx Proxy Manager перед текущим nginx-контейнером.
2. Перенести TLS в host-nginx с certbot.

Ниже быстрый host-nginx + certbot вариант.

### 8.1 Установить nginx/certbot на хост

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 8.2 Настроить reverse proxy в `/etc/nginx/sites-available/night_mode`

```nginx
server {
    server_name nightmode.example.com;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/night_mode /etc/nginx/sites-enabled/night_mode
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d nightmode.example.com
```

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
- Точный `CORS_ORIGINS` (только ваш домен)
- Не хранить секреты в git
- Регулярная ротация Firebase service account ключей

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
