# Repository Guidelines

## Project Structure & Module Organization
This is a monorepo with three main apps and shared infrastructure.
- `backend/` Django + DRF API and Celery workers. App code lives in `backend/apps/*`.
- `tm_web/` Vite + React web client.
- `tm_mob/` React (react-scripts) client used for mobile/web.
- `docker-compose.yml` defines Postgres, Redis, Django, and Celery services.
- `fix.md` tracks performance/DB tuning tasks.

## Build, Test, and Development Commands
Use Docker for the backend stack and npm for frontend apps.
```bash
# Backend + DB + Redis
docker compose up --build

# Django migrations (inside container)
docker compose exec tm_backend python manage.py migrate

# Web frontend
cd tm_web
npm install
npm run dev

# Mobile/web client
cd tm_mob
npm install
npm start
```
Build and lint (web):
```bash
cd tm_web
npm run build
npm run lint
```
Tests (mobile/web):
```bash
cd tm_mob
npm test
```

## Coding Style & Naming Conventions
- Python: follow standard Django style; keep apps in `backend/apps/<app_name>`.
- TypeScript/React: lint with ESLint in `tm_web` (`npm run lint`).
- Keep filenames descriptive and aligned with feature scope (e.g., `AssignmentHistoryPage.tsx`).

## Testing Guidelines
- Backend tests use Django’s test runner with `TestCase` in `backend/apps/*/tests.py`.
- Mobile/web tests use `react-scripts test` in `tm_mob`.
- Web app does not define tests yet; add as needed and document new commands here.

## Commit & Pull Request Guidelines
Recent commits are short, imperative, and descriptive (e.g., “add assignment log page”).
- Commit messages: use a brief verb phrase, avoid punctuation, keep it under ~70 chars.
- PRs should include a short summary, affected services, and screenshots for UI changes.

## Security & Configuration Tips
- Set DB env vars in `.env` as referenced by `docker-compose.yml`.
- If `django-storages` isn’t installed locally, Django may fail to boot; install deps before running migrations.
