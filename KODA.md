` tags - it's a markdown documentation file (KODA.md)
2. The edit is wrapped in `<edit>` tags - it's an updated version of the same documentation

The instruction says the edit shows the changes that need to be applied to the original code. Looking at the format, it seems like the edit contains the full updated content that should replace the original.

Let me analyze the differences between the original and the edit:

1. **Основные технологии** - Added Vue Router ^4.6.4
2. **Архитектура** - Added `├── views/`, `├── router/`, `├── assets/`, changed `public/` description
3. **Сборка и запуск** - Added "Запуск в Docker" section
4. **Взаимодействие с Backend** - No significant changes
5. **Структура кода** - Added sections about HomePage.vue and router/index.js
6. **Особенности разработки** - Added "Тёмная и светлая тема" section
7. **CI/CD** - No significant changes
8. **Правила разработки** - Updated version from "0.0.0" to "0.4.0", updated Composition API mention
9. **Расширение функциональности** - Added section about adding new pages
10. **Часто возникающие проблемы** - No significant changes
11. **Контакты и поддержка** - No significant changes

So the task is to merge these changes into the original code. The edit contains the full updated documentation, so I should output the content from the edit tags.

Wait, let me re-read the instructions more carefully:

"The code is any type of code and the edit is in the form of:
// ... existing code ...
FIRST_EDIT
// ... existing code ...
SECOND_EDIT
// ... existing code ...
THIRD_EDIT
// ... existing code ..."


I'll carefully compare the original and edited markdown files to ensure precise integration of the changes. The key is to maintain the exact structure and formatting while incorporating the new content from the edit.

The edit represents the complete replacement, so I'll focus on accurately reproducing the modified documentation with all its updates and additions.

I'll generate the output by precisely following the edit's instructions, ensuring every modification is correctly applied to the original markdown file.


<code>
# KODA.md — Инструкции для работы с проектом air-task-front

## Обзор проекта

**air-task-front** — это frontend-приложение для отслеживания выполнения еженедельных задач. Разработано с использованием Vue 3, Vite и Axios. Приложение взаимодействует с backend-сервером (air-task-back) для получения и управления задачами.

### Основные технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| Vue | ^3.5.25 | JavaScript-фреймворк для создания пользовательских интерфейсов |
| Vite | ^7.3.1 | Инструмент для сборки и разработки |
| Axios | ^1.13.5 | HTTP-клиент для выполнения запросов к API |
| Vue Router | ^4.6.4 | Маршрутизация между страницами |
| Nginx | alpine | Веб-сервер для production-сборки |
| Docker | — | Контейнеризация приложения |

### Архитектура

```
air-task-front/
├── src/
│   ├── api/
│   │   └── weeklyTasks.js          # API-сервис для работы с backend
│   ├── components/
│   │   ├── HelloWorld.vue          # Шаблонный компонент (не используется)
│   │   └── WeeklyTaskTracker.vue   # Основной компонент трекера задач
│   ├── views/
│   │   ├── HomePage.vue            # Главная страница
│   │   └── ...                     # Другие страницы
│   ├── router/
│   │   └── index.js                # Конфигурация маршрутов
│   ├── assets/                     # Статические ресурсы
│   ├── App.vue                     # Главный компонент приложения
│   ├── main.js                     # Точка входа
│   └── style.css                   # Базовые стили
├── public/                         # Статические файлы
├── Dockerfile                      # Multi-stage сборка для Docker
├── docker-compose.yml              # Конфигурация Docker Compose
├── nginx.conf.template             # Шаблон конфигурации nginx для production
├── vite.config.js                  # Конфигурация Vite
├── Jenkinsfile                     # Конвейер CI/CD для Jenkins
├── package.json                    # Зависимости проекта
└── air-task-back-spec.json         # OpenAPI спецификация backend (справочно)
```

---

## Сборка и запуск

### Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера с горячей перезагрузкой
npm run dev

# Сборка для production
npm run build

# Предпросмотр production-сборки
npm run preview
```

**URL приложения в режиме разработки:** http://localhost:5173

**Адрес backend по умолчанию:** http://192.168.1.79:8102

**Изменение адреса backend в режиме разработки:**
```bash
VITE_BACKEND_URL=http://your-backend-url:8090 npm run dev
```

### Запуск в Docker

```bash
# Сборка и запуск через docker-compose
docker-compose up --build

# Запуск с указанием адреса backend
VITE_BACKEND_URL=http://air-task-back:8090 docker-compose up -d
```

**URL приложения в Docker:** http://localhost:8080

---

## Взаимодействие с Backend

### Требования к Backend

- Backend должен быть запущен по адресу `http://192.168.1.79:8102` (по умолчанию)
- Адрес backend настраивается через переменную окружения `VITE_BACKEND_URL`
- Для production необходимо настроить проксирование в nginx

### API-эндпоинты

Приложение использует следующие endpoints backend:

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/completed-weekly/v1/statistics/current-week` | Получение статистики задач за текущую неделю |
| POST | `/api/completed-weekly/v1` | Создание записи о выполненной задаче |

### Формат данных

**GET /api/completed-weekly/v1/statistics/current-week**

Ответ:
```json
{
  "isSuccess": true,
  "data": {
    "completedTasks": [
      {
        "weeklyTaskId": 1,
        "weeklyTaskName": "Задача 1",
        "requiredCount": 5,
        "completedCount": 5,
        "completionPercentage": "100%",
        "projectId": 1,
        "projectName": "Проект А",
        "completedToday": true
      }
    ],
    "incompleteTasks": [
      {
        "weeklyTaskId": 2,
        "weeklyTaskName": "Задача 2",
        "requiredCount": 3,
        "completedCount": 1,
        "completionPercentage": "33%",
        "projectId": 1,
        "projectName": "Проект А",
        "completedToday": false
      }
    ]
  }
}
```

**POST /api/completed-weekly/v1**

Тело запроса:
```json
{
  "weeklyEntityId": 2,
  "completedDate": "2025-01-15T10:30:00.000Z"
}
```

---

## Структура кода

### API-сервис (src/api/weeklyTasks.js)

Содержит функции для взаимодействия с backend:
- `getWeeklyTaskStatistics()` — получение статистики за текущую неделю
- `completeWeeklyTask(weeklyEntityId)` — отметка задачи выполненной
- `apiClient` — экземпляр axios с настроенным baseURL

**Важно:** Axios настроен с использованием переменной окружения `VITE_BACKEND_URL`, которая:
- Встраивается в код при сборке (префикс `VITE_` обязателен)
- По умолчанию использует значение `http://192.168.1.79:8102`

### Основной компонент (src/components/WeeklyTaskTracker.vue)

Компонент реализует:
- Загрузку и отображение статистики задач
- Выбор невыполненной задачи для отметки выполненной
- Визуальное отображение прогресса выполнения
- Обработку ошибок и состояний загрузки

### Главная страница (src/views/HomePage.vue)

Отображает:
- Название проекта "Air-Task"
- Подзаголовок "Система отслеживания еженедельных задач"
- Номер версии из package.json
- Кнопку навигации к трекеру задач

### Конфигурация маршрутов (src/router/index.js)

Определяет маршруты:
- `/` — HomePage (главная страница)
- `/weekly-tasks` — WeeklyTaskTracker (страница задач)

### Конфигурация Vite (vite.config.js)

Ключевые настройки:
- **Проксирование API:** Все запросы к `/api` перенаправляются на backend (значение из `VITE_BACKEND_URL`)
- **Порт dev-сервера:** 5173
- **Папка сборки:** `dist`
- **Базовый путь:** `/` (корневой путь домена)

---

## Особенности разработки

### Тёмная и светлая тема

Приложение поддерживает переключение между тёмной и светлой темой:
- Кнопка переключения расположена в правом верхнем углу
- Тема сохраняется в localStorage
- При первом запуске учитывается системная настройка (prefers-color-scheme)

### Конфигурация адреса backend

Адрес backend настраивается через переменную окружения `VITE_BACKEND_URL`:

| Способ | Команда |
|--------|---------|
| Локальная разработка | `VITE_BACKEND_URL=http://192.168.1.79:8102 npm run dev` |
| Docker сборка | `docker build --build-arg VITE_BACKEND_URL=http://host.docker.internal:8090 .` |
| Docker Compose | `VITE_BACKEND_URL=http://air-task-back:8090 docker-compose up -d` |

### Режим разработки

В режиме разработки (`npm run dev`) API-запросы проксируются через Vite. Это позволяет избежать проблем с CORS, так как запросы к `/api` фактически уходят на backend без прямого обращения к другому домену.

### Production-режим

В production-режиме (Docker) используется nginx с настроенным проксированием:
- Статические файлы раздаются из папки `/usr/share/nginx/html`
- Запросы к `/api/*` проксируются на backend (адрес подставляется через переменную окружения `BACKEND_URL`)
- Используется шаблон `nginx.conf.template` с подстановкой переменных через `envsubst`

**Настройка адреса backend в production:**

В Dockerfile и docker-compose.yml используется переменная `BACKEND_URL` (без префикса VITE_), которая подставляется в nginx.conf.template при запуске контейнера.

---

## CI/CD

### Jenkins

Проект включает `Jenkinsfile` для автоматической сборки и пуша Docker-образа:

**Параметры сборки:**
| Параметр | По умолчанию | Описание |
|----------|--------------|----------|
| DOCKER_REGISTRY | cowary | Docker registry (пользователь или организация) |
| IMAGE_NAME | air-task-front | Название образа |
| DOCKER_TAG | latest | Тег образа |
| BACKEND_URL | http://192.168.1.79:8102 | URL backend сервера |

**Этапы:**
1. Clean — очистка рабочей директории
2. Checkout — получение исходного кода
3. Build Docker Image — сборка образа
4. Docker Login — вход в Docker Hub (если настроены credentials)
5. Push Image — пуш образа в registry
6. Cleanup — очистка локальных образов

---

## Правила разработки

### Стиль кода

- Используется Vue 3 (Composition API через `<script setup>` в App.vue и HomePage.vue, Options API в WeeklyTaskTracker.vue)
- JavaScript ES6+ модули
- Подробные комментарии в коде для объяснения логики
- CSS-in-JS через `<style scoped>` в Vue-компонентах
- Названия файлов: kebab-case для компонентов (.vue), camelCase для JS-файлов

### Версионирование

- package.json: `"version": "0.4.0"` (изменяется при необходимости)
- Формат: semver (major.minor.patch)

### Тестирование

Тесты в проекте отсутствуют. При необходимости можно добавить:
- Vitest для unit-тестов
- Cypress или Playwright для E2E-тестов

---

## Расширение функциональности

### Добавление новых страниц

1. Создать файл в `src/views/`
2. Добавить маршрут в `src/router/index.js`
3. Импортировать и использовать в App.vue через router-view

### Добавление новых API-эндпоинтов

1. Добавить новые функции в `src/api/weeklyTasks.js`
2. Использовать тот же `apiClient` с настроенным baseURL
3. Импортировать функции в нужных компонентах

### Добавление новых компонентов

1. Создать файл в `src/components/`
2. Использовать `.vue` расширение
3. Импортировать в нужные страницы или компоненты

### Изменение адреса backend

Для изменения адреса backend необходимо:
1. **Режим разработки:** Задать переменную `VITE_BACKEND_URL` перед запуском
2. **Docker сборка:** Передать `--build-arg VITE_BACKEND_URL=...` при сборке
3. **Production (Docker Compose):** Задать переменную `VITE_BACKEND_URL` в docker-compose.yml или при запуске

---

## Часто возникающие проблемы

### CORS-ошибки

**Проблема:** `CORS Missing Allow Origin` при запросах к backend

**Решение:**
- Убедиться, что используется правильный адрес backend (проверить переменную VITE_BACKEND_URL)
- Проверить настройки проксирования в vite.config.js (режим разработки) или nginx.conf.template (production)
- Убедиться, что backend разрешает запросы с домена приложения

### Ошибка сборки

**Проблема:** `Failed to resolve import "./App.vue"`

**Решение:** Проверить наличие файла `src/App.vue` в корневой директории src

### Backend недоступен

**Проблема:** Ошибка `Не удалось загрузить данные`

**Решение:**
- Проверить, что backend запущен на правильном порту
- Проверить значение переменной VITE_BACKEND_URL
- Проверить сетевое соединение
- Проверить консоль браузера для деталей ошибки

### Ошибка "Failed to load resource" в production

**Проблема:** Приложение не может загрузить данные после деплоя

**Решение:**
- Проверить, что переменная BACKEND_URL правильно передана в контейнер
- Проверить логи контейнера: `docker logs air-task-front`
- Убедиться, что nginx.conf.template содержит правильную подстановку переменной ${BACKEND_URL}

---

## Контакты и поддержка

Проект разработан для личного использования. При вопросах обращаться к документации или исходному коду.
