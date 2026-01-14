# DocuMind Developer Guide

This is a quickstart for local development. For deeper context, see:
- `docs/ARCHITECTURE.md`
- `docs/MAINTENANCE.md`

## Prerequisites

- Python 3.11+
- Node.js 20+
- Redis
- PostgreSQL with pgvector
- Docker and Docker Compose (recommended)

## Environment setup

```
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Populate `OPENAI_API_KEY` and other required values in `server/.env`.

## Run with Docker

```
docker-compose up -d --build
```

URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/swagger/

## Run without Docker

Backend:
```
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Celery worker:
```
cd server
venv\Scripts\activate
celery -A config worker --loglevel=info
```

Frontend:
```
cd client
npm install
npm run dev
```

## Common commands

- `python manage.py makemigrations`
- `python manage.py migrate`
- `python manage.py createsuperuser`
- `python manage.py seed_egyptian_laws --force`
- `docker-compose logs -f`
- `docker-compose down -v`
