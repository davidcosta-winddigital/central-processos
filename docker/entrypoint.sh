#!/usr/bin/env bash
set -e

APP_SRC="/srv/app"
APP_DIR="/var/www/html"

echo "[entrypoint] sincronizando $APP_SRC -> $APP_DIR"
mkdir -p "$APP_DIR"
rsync -a --delete --exclude='/storage' "$APP_SRC/" "$APP_DIR/"

cd "$APP_DIR"

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

if [ -n "$DB_HOST" ]; then
  echo "[entrypoint] aguardando ${DB_HOST}:${DB_PORT:-3306}..."
  for i in $(seq 1 60); do
    if mysqladmin ping -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p"$DB_PASSWORD" --silent >/dev/null 2>&1; then
      echo "[entrypoint] DB OK"
      break
    fi
    sleep 2
  done
fi

if [ -z "$APP_KEY" ]; then
  echo "[entrypoint] gerando APP_KEY"
  php artisan key:generate --force --no-interaction || true
fi

php artisan package:discover --ansi || true
php artisan storage:link --force || true

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "[entrypoint] rodando migrations..."
  php artisan migrate --force --no-interaction || echo "[entrypoint] migrations falharam (continuando)"
fi

if [ "${APP_ENV:-production}" = "production" ]; then
  php artisan config:cache || true
  php artisan route:cache || true
  php artisan view:cache || true
  php artisan event:cache || true
fi

echo "[entrypoint] iniciando: $@"
exec "$@"
