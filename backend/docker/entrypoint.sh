#!/bin/sh
set -e

cd /var/www

# Copy .env if not exists
[ -f .env ] || cp .env.example .env

# Override with production values from environment
[ -n "$APP_KEY" ]        && sed -i "s|APP_KEY=.*|APP_KEY=$APP_KEY|" .env
[ -n "$APP_URL" ]        && sed -i "s|APP_URL=.*|APP_URL=$APP_URL|" .env
[ -n "$MP_ACCESS_TOKEN" ] && sed -i "s|MP_ACCESS_TOKEN=.*|MP_ACCESS_TOKEN=$MP_ACCESS_TOKEN|" .env
[ -n "$MP_PUBLIC_KEY" ]   && sed -i "s|MP_PUBLIC_KEY=.*|MP_PUBLIC_KEY=$MP_PUBLIC_KEY|" .env
[ -n "$MP_WEBHOOK_SECRET" ] && sed -i "s|MP_WEBHOOK_SECRET=.*|MP_WEBHOOK_SECRET=$MP_WEBHOOK_SECRET|" .env
[ -n "$MP_SELLER_ZIP_CODE" ] && sed -i "s|MP_SELLER_ZIP_CODE=.*|MP_SELLER_ZIP_CODE=$MP_SELLER_ZIP_CODE|" .env
[ -n "$MP_ADMIN_EMAIL" ]  && sed -i "s|MP_ADMIN_EMAIL=.*|MP_ADMIN_EMAIL=$MP_ADMIN_EMAIL|" .env
[ -n "$MAIL_MAILER" ]     && sed -i "s|MAIL_MAILER=.*|MAIL_MAILER=$MAIL_MAILER|" .env
[ -n "$MAIL_HOST" ]       && sed -i "s|MAIL_HOST=.*|MAIL_HOST=$MAIL_HOST|" .env
[ -n "$MAIL_PORT" ]       && sed -i "s|MAIL_PORT=.*|MAIL_PORT=$MAIL_PORT|" .env
[ -n "$MAIL_USERNAME" ]   && sed -i "s|MAIL_USERNAME=.*|MAIL_USERNAME=$MAIL_USERNAME|" .env
[ -n "$MAIL_PASSWORD" ]   && sed -i "s|MAIL_PASSWORD=.*|MAIL_PASSWORD=$MAIL_PASSWORD|" .env

# Set production mode
sed -i "s|APP_ENV=.*|APP_ENV=production|" .env
sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|" .env

# Database is SQLite - ensure it exists
touch /data/database.sqlite
sed -i "s|DB_CONNECTION=.*|DB_CONNECTION=sqlite|" .env
echo "DB_DATABASE=/data/database.sqlite" >> .env

# Generate key if missing
php artisan key:generate --no-interaction --force 2>/dev/null || true

# Run migrations
php artisan migrate --force --no-interaction

# Cache for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Storage link
php artisan storage:link 2>/dev/null || true

chown -R www-data:www-data /data /var/www/storage

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
