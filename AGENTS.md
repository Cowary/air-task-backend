# AGENTS.md - Air Task Front

## Developer Commands

- `npm run dev` — Start Vite dev server on port `5173` (requires `VITE_BACKEND_URL`)
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build
- `npm test` — Run Vitest unit tests once (`vitest run`); `npm run test:watch` for watch mode

Tests use **Vitest + @vue/test-utils + jsdom** (config in `vitest.config.js`, specs at `src/**/*.spec.js`, mostly co-located under `__tests__/`). CI (`Jenkinsfile`) runs them in a `node:20-alpine` container before the Docker build. No lint or typecheck scripts are configured; use `npm run build` as the basic syntax/compile check.

## Environment

Required for dev:

```bash
VITE_BACKEND_URL=http://192.168.1.79:8102 npm run dev
```

Default backend: `http://localhost:8090`.

Optional timezone override (defaults: `Europe/Moscow`, `+03:00`):

```bash
VITE_APP_TIMEZONE=Europe/Moscow VITE_APP_TIMEZONE_OFFSET=+03:00 npm run dev
```

Timezone helpers live in `src/utils/timezone.js`.

## Architecture

- SPA on Vue 3 + Vue Router 4 + Vite.
- Entry point: `src/main.js`; router: `src/router/index.js`.
- `src/views/` — page components (mostly Options API).
- `src/components/` — reusable components (mixed Options API / `<script setup>`).
- `src/api/` — axios client and per-domain API modules.
- `src/store/auth.js` — reactive auth state backed by `localStorage`.
- `src/style.css` — global CSS custom properties and light/dark theme.

## API / Backend

- API client base URL is `/api` (`src/api/client.js`). Only `/api` is proxied by Vite dev server to `VITE_BACKEND_URL` (`vite.config.js`).
- Frontend calls are therefore prefixed with `/api`, but the backend receives the path without `/api`.
- Backend contracts are documented in `air-task-back-spec.json`.
- Backend returns `{ isSuccess, data, errorMessage }`; views/components check `response.isSuccess` before using `response.data`.

## Auth

- `initAuth()` is called when `router/index.js` is loaded.
- JWT token is stored in `localStorage` under `token`.
- HTTP 401 from any API call clears the token and redirects to `/login`.
- HTTP 503 on login means the backend has auth disabled; the app marks the session as authenticated via `auth_disabled` in `localStorage`.

## Docker

- `Dockerfile` builds with `npm run build` and serves via nginx.
- Runtime backend URL is set with `BACKEND_URL` (no `VITE_` prefix), defaulting to `http://192.168.1.79:8102`.
- `docker-compose.yml` exposes port `8080:80`.

## Conventions

- CSS custom properties are defined in `src/style.css`; dark mode is activated by `data-theme="dark"` on `<html>`.
- Modals use `v-if` with a `.modal-overlay` wrapper and `@click.stop` on content.
- UI text is in Russian.
