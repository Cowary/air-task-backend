FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run test

RUN npm run build

# =============================================================================

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

ENV BACKEND_URL=http://192.168.1.79:8102

COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]