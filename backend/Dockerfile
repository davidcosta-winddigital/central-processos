FROM php:8.3-cli

ARG DEBIAN_FRONTEND=noninteractive

# ── Dependências de sistema ────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
        git \
        curl \
        zip \
        unzip \
        libzip-dev \
        libonig-dev \
        libxml2-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        default-mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        bcmath \
        zip \
        gd \
        opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

# ── Composer ───────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . /var/www/html

# Composer install (não falha o build se faltar lock; será resolvido em runtime)
RUN if [ -f composer.json ]; then \
        composer install --no-interaction --prefer-dist --no-scripts || true; \
    fi

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
