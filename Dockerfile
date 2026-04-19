# Используем официальный образ Node.js версии 20 в качестве базового
# Это нужно для сборки Vue-приложения
FROM node:20-alpine AS builder

# Аргумент для передачи адреса backend при сборке
# Использование: docker build --build-arg VITE_BACKEND_URL=http://host.docker.internal:8090 .
ARG VITE_BACKEND_URL=http://192.168.1.79:8102
# Преобразуем в переменную Vite (VITE_ обязателен для встраивания в код)
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл package.json и package-lock.json в контейнер
# Это делается отдельно для оптимизации кэширования слоёв Docker
COPY package*.json ./

# Устанавливаем зависимости проекта
RUN npm install

# Копируем остальные исходные файлы проекта
COPY . .

# Передаём VITE_BACKEND_URL как переменную окружения для сборки
# VITE_ переменные встраиваются в код при сборке
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Собираем Vue-приложение для продакшена
RUN npm run build

# =============================================================================
# Вторая стадия: создание минимального образа для запуска приложения
# =============================================================================

# Используем легковесный образ nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем собранные файлы из стадии builder в директорию nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Устанавливаем envsubst для подстановки переменных окружения
RUN apk add --no-cache openssl

# Значения по умолчанию для переменных окружения
# Если BACKEND_URL не передана, используется localhost:8090
ENV BACKEND_URL=http://192.168.1.79:8102

# Копируем шаблон конфига nginx
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Создаём скрипт entrypoint, который генерирует конфиг с подставленными переменными
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'export BACKEND_URL=${BACKEND_URL:-http://192.168.1.79:8102}' >> /entrypoint.sh && \
    echo 'envsubst "\${BACKEND_URL}" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf' >> /entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Указываем, какой порт открыть (nginx по умолчанию слушает 80)
EXPOSE 80

# Используем entrypoint для генерации конфига с переменными окружения
ENTRYPOINT ["/entrypoint.sh"]
