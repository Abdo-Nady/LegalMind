# DocuMind Maintenance Guide

This document captures operational assumptions and runbook tasks for long-term maintenance.

## Required services

- Redis (Celery broker and DRF throttling cache)
- PostgreSQL with pgvector (embedding storage)
- OpenAI API access (embeddings and chat responses)

## Environment variables

Server (`server/.env`):
- `OPENAI_API_KEY` (required for all AI features)
- `PGVECTOR_CONNECTION_STRING` (required for embeddings)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (required for Google OAuth)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (required for password reset emails)
- `FRONTEND_URL` (used for password reset links)

Client (`client/.env`):
- `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api`)
- `VITE_GOOGLE_CLIENT_ID`

## Local development

### Docker (recommended)

```
docker-compose up -d --build
```

This starts Postgres, Redis, the Django API, the Celery worker, and the Vite dev server.

### Manual (no Docker)

1. Start Redis and Postgres (with pgvector enabled).
2. Backend:
   - `cd server`
   - `python -m venv venv`
   - `venv\Scripts\activate` (Windows) or `source venv/bin/activate`
   - `pip install -r requirements.txt`
   - `python manage.py migrate`
   - `python manage.py runserver`
3. Celery worker:
   - `celery -A config worker --loglevel=info`
4. Frontend:
   - `cd client`
   - `npm install`
   - `npm run dev`

## Runbook tasks

- Rebuild containers: `docker-compose up -d --build`
- Reset all local data: `docker-compose down -v` (drops volumes)
- Reseed Egyptian laws: `python manage.py seed_egyptian_laws --force`
- Troubleshoot stuck documents: verify the Celery worker is running and has access to `OPENAI_API_KEY` and pgvector.

## Hidden assumptions and gotchas

- Celery must be running or documents will remain in `processing` forever.
- The app uses SQLite for Django data by default, but embeddings are stored in Postgres. This means two data stores must be managed.
- `seed_egyptian_laws` runs at container startup and requires `OPENAI_API_KEY`. Without it, law features will not become ready.
- The Egyptian law list is duplicated in the frontend and backend and must be kept in sync.
- Tokens are stored in localStorage; if stronger security is required, move to httpOnly cookies and adjust both server and client.
- DRF throttling uses Redis DB 1; Celery uses Redis DB 0. Changing Redis config can break rate limits.
- `docker-entrypoint.sh` runs migrations on every startup. For production, consider moving migrations to a controlled deploy step.

## Long-term maintenance tips

- Keep the embedding and chat model versions pinned in `langchain_config.py` to avoid silent behavior changes.
- When updating prompts, document the change and run a sample regression on a few known PDFs.
- Add new document features through the chain -> view -> service pattern so the pipeline stays consistent.
- Keep `.env.example` files updated when adding new config values.
