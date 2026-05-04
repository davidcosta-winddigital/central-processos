# ============================================================
# Imagem unica de producao - central-processos
# Stage 1: builda o frontend (Vite)
# Stage 2: instala vendor do Laravel (composer, sem dev)
# Stage final: php-fpm + nginx + supervisord (scheduler + queue)
# ============================================================

# ------------------------------------------------------------
# Stage 1 - Frontend (React + Vite)
# ------------------------------------------------------------
FROM node:20-alpine AS frontend
WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------
# Stage 2 - Composer / vendor
# ------------------------------------------------------------
FROM composer:2 AS vendor
WORKDIR /app

COPY backend/composer.json backend/composer.lock* ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY backend/ ./
# Limpa caches herdados do dev (packages.php, services.php) para evitar
# referencias a pacotes dev como nunomaduro/collision durante o discover.
RUN rm -f bootstrap/cache/*.php \
    && composer dump-autoload --optimize --no-dev --no-scripts

# ------------------------------------------------------------
# Stage final - PHP-FPM + Nginx + Supervisord
# ------------------------------------------------------------
FROM php:8.3-fpm
ENV DEBIAN_FRONTEND=noninteractive

# Dependencias de sistema + extensoes PHP
RUN apt-get update && apt-get install -y --no-install-recommends \
        git curl zip unzip rsync \
        nginx supervisor \
        libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
        libonig-dev libxml2-dev default-mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql mbstring exif pcntl bcmath gd zip opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

# Tuning PHP / OPcache
RUN { \
        echo "opcache.enable=1"; \
        echo "opcache.memory_consumption=192"; \
        echo "opcache.max_accelerated_files=20000"; \
        echo "opcache.validate_timestamps=0"; \
    } > /usr/local/etc/php/conf.d/opcache.ini \
    && { \
        echo "memory_limit=512M"; \
        echo "upload_max_filesize=64M"; \
        echo "post_max_size=64M"; \
    } > /usr/local/etc/php/conf.d/zz-app.ini

# Codigo Laravel (com vendor)
WORKDIR /srv/app
COPY --from=vendor /app/ /srv/app/
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data /srv/app

# Frontend buildado
COPY --from=frontend /app/dist /srv/static

# Nginx
COPY docker/nginx/prod.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default \
    && ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default \
    && sed -i 's/^user .*/user www-data;/' /etc/nginx/nginx.conf \
    && mkdir -p /run/nginx /var/log/supervisor

# Supervisord + entrypoint
COPY docker/supervisord.conf /etc/supervisor/conf.d/app.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /var/www/html
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
