# Server Deploy Checklist (Copy-Paste)

## 1) Server bootstrap
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates ufw
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 2) Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 3) Clone app
```bash
sudo mkdir -p /opt/night_mode
sudo chown -R $USER:$USER /opt/night_mode
git clone <YOUR_GIT_REPO_URL> /opt/night_mode
cd /opt/night_mode
```

## 4) Prepare env
```bash
cp .env.deploy.example .env
cp backend/.env.example backend/.env
nano .env
nano backend/.env
```

## 5) Start stack
```bash
docker compose up --build -d
docker compose ps
curl http://127.0.0.1/health
```

## 6) Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f gateway
```

## 7) Update release
```bash
cd /opt/night_mode
git pull --ff-only
docker compose up --build -d
docker image prune -f
```

## 8) Rollback
```bash
cd /opt/night_mode
git log --oneline -n 5
git checkout <PREVIOUS_COMMIT>
docker compose up --build -d
```
