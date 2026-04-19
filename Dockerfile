FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# =============================================================================

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN apk add --no-cache openssl

ENV BACKEND_URL=http://192.168.1.79:8102

COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'export BACKEND_URL=${BACKEND_URL:-http://192.168.1.79:8102}' >> /entrypoint.sh && \
    echo 'echo "==> BACKEND_URL: $BACKEND_URL"' >> /entrypoint.sh && \
    echo 'envsubst "\${BACKEND_URL}" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf' >> /entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]