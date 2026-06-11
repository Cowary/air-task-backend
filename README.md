# Air Task Frontend

Vue 3 + Vite приложение для управления задачами.

## Запуск из IDE (dev mode)

### IDEA

1. **Run → Edit Configurations...**
2. Создать/редактировать npm конфигурацию с `npm run dev`
3. В поле **Environment variables** добавить:
   ```
   VITE_BACKEND_URL=http://192.168.1.79:8102
   ```

### Терминал

```bash
VITE_BACKEND_URL=http://192.168.1.79:8102 npm run dev
```

По умолчанию: `http://localhost:8090`

### Таймзона

Приложение использует `Europe/Moscow` (`+03:00`) по умолчанию. Чтобы изменить:

```bash
VITE_APP_TIMEZONE=Europe/Moscow VITE_APP_TIMEZONE_OFFSET=+03:00 npm run dev
```

Или добавить переменные в конфигурацию запуска IDEA:
```
VITE_APP_TIMEZONE=Asia/Vladivostok
VITE_APP_TIMEZONE_OFFSET=+10:00
```

Доступные таймзоны — любой IANA-идентификатор (напр. `Europe/London`, `America/New_York`).

## Запуск в Production (Docker)

### Способ 1: docker-compose

```yaml
services:
  air-task-front:
    environment:
      - BACKEND_URL=http://air-task-back:8090
```

### Способ 2: запуск контейнера

```bash
docker run -d -p 8080:80 -e BACKEND_URL=http://192.168.1.79:8102 air-task-front:latest
```

### Логи

При запуске контейнера выводится адрес backend:
```
==> BACKEND_URL: http://air-task-back:8090
```