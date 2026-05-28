#!/bin/sh
set -e

APP_DIR=/var/www/html
REPO=https://github.com/beagioielli/Zefirus-BeArt.git
FRONTEND_VERSION="2"

echo "[setup] Iniciando..."

# Instala Node.js e git se necessário
apk add --no-cache nodejs npm git 2>/dev/null || true

build_frontend() {
    echo "[setup] Buildando frontend..."
    cd /tmp/zefirus/frontend
    VITE_API_URL=https://zefirusart.com/api npm ci --silent
    VITE_API_URL=https://zefirusart.com/api npm run build
    mkdir -p "$APP_DIR/public/app"
    cp -r dist/. "$APP_DIR/public/app/"
    echo "$FRONTEND_VERSION" > "$APP_DIR/.frontend_version"
    echo "[setup] Frontend buildado (v$FRONTEND_VERSION)"
}

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

    build_frontend

    chown -R application:application "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" /data 2>/dev/null || \
    chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" /data 2>/dev/null || true

    rm -rf /tmp/zefirus
    touch "$APP_DIR/.initialized"
    echo "[setup] Setup concluido!"
else
    # Verifica se o frontend precisa ser atualizado
    CURRENT_VERSION=$(cat "$APP_DIR/.frontend_version" 2>/dev/null || echo "0")
    if [ "$CURRENT_VERSION" != "$FRONTEND_VERSION" ]; then
        echo "[setup] Frontend desatualizado (v$CURRENT_VERSION -> v$FRONTEND_VERSION), reconstruindo..."
        git clone --depth=1 "$REPO" /tmp/zefirus
        build_frontend
        rm -rf /tmp/zefirus
    fi
fi

# A cada boot: garantir permissoes e regenerar config cache usando a chave do .env
# (env -u APP_KEY garante que o env vazio do docker-compose nao sobrescreva a chave do .env)
cd "$APP_DIR"
chmod -R 755 bootstrap/cache storage 2>/dev/null || true
chown -R application:application bootstrap/cache storage /data 2>/dev/null || \
chown -R www-data:www-data bootstrap/cache storage /data 2>/dev/null || true
env -u APP_KEY php artisan config:cache 2>/dev/null || true
env -u APP_KEY php artisan route:cache 2>/dev/null || true

# Nginx: write complete nginx.conf override via provision hook (runs last, after 20-nginx.sh)
mkdir -p /opt/docker/provision/entrypoint.d
cat > /opt/docker/provision/entrypoint.d/99-laravel-nginx.sh << 'PROVISION_EOF'
#!/bin/sh
mkdir -p /opt/docker/etc/nginx

# Overwrite the main nginx.conf with a Laravel-compatible version
cat > /opt/docker/etc/nginx/nginx.conf << 'NGINX_EOF'
worker_processes auto;
pid /var/run/nginx.pid;
error_log /dev/stderr warn;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log off;
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;

        root /var/www/html/public;
        index index.php index.html;
        charset utf-8;

        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }

        location /app {
            try_files $uri /app/index.html;
        }

        location /app/ {
            try_files $uri /app/index.html;
        }

        location = /favicon.ico { access_log off; log_not_found off; }
        location = /robots.txt  { access_log off; log_not_found off; }

        error_page 404 /index.php;

        location ~ \.php$ {
            fastcgi_pass 127.0.0.1:9000;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
            include /etc/nginx/fastcgi_params;
            fastcgi_param SERVER_NAME $host;
        }

        location ~ /\.(?!well-known).* {
            deny all;
        }
    }
}
NGINX_EOF

# Fix permissions on public directory
chmod -R 755 /var/www/html/public 2>/dev/null || true
PROVISION_EOF
chmod +x /opt/docker/provision/entrypoint.d/99-laravel-nginx.sh

echo "[setup] Iniciando servidor..."
exec /opt/docker/bin/entrypoint.sh supervisord
