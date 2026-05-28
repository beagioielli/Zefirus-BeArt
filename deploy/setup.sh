#!/bin/sh
set -e

APP_DIR=/var/www/html
REPO=https://github.com/beagioielli/Zefirus-BeArt.git

echo "[setup] Iniciando..."

# Instala Node.js e git se necessário
apk add --no-cache nodejs npm git 2>/dev/null || true

if [ ! -f "$APP_DIR/.initialized" ]; then
    echo "[setup] Primeira execucao - clonando e configurando..."

    git clone --depth=1 "$REPO" /tmp/zefirus

    # Backend
    cp -a /tmp/zefirus/backend/. "$APP_DIR/"
    cd "$APP_DIR"
    composer install --no-dev --optimize-autoloader --no-interaction --quiet

    # .env
    cp .env.example .env
    sed -i "s|APP_URL=.*|APP_URL=https://zefirusart.com|" .env
    sed -i "s|APP_ENV=.*|APP_ENV=production|" .env
    sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|" .env

    # SQLite
    mkdir -p /data
    touch /data/database.sqlite
    printf "\nDB_DATABASE=/data/database.sqlite\n" >> .env

    # Laravel
    php artisan key:generate --force
    php artisan migrate --force
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan storage:link 2>/dev/null || true

    # Frontend
    echo "[setup] Buildando frontend..."
    cd /tmp/zefirus/frontend
    VITE_API_URL=https://zefirusart.com/api npm ci --silent
    VITE_API_URL=https://zefirusart.com/api npm run build

    mkdir -p "$APP_DIR/public/app"
    cp -r dist/. "$APP_DIR/public/app/"

    chown -R application:application "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" /data 2>/dev/null || \
    chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" /data 2>/dev/null || true

    rm -rf /tmp/zefirus
    touch "$APP_DIR/.initialized"
    echo "[setup] Setup concluido!"
fi

# Nginx: SPA routing para /app/*
mkdir -p /opt/docker/etc/nginx/vhost.common.d
cat > /opt/docker/etc/nginx/vhost.common.d/10-spa.conf << 'NGINX'
location /app {
    try_files $uri /app/index.html;
}
location /app/ {
    try_files $uri /app/index.html;
}
NGINX

echo "[setup] Iniciando servidor..."
exec /opt/docker/bin/entrypoint.sh supervisord
