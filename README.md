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