# DocuMind

DocuMind is a full-stack web app for legal document analysis using retrieval-augmented generation (RAG). Users upload PDFs, the system extracts and embeds content, and the UI provides chat, summaries, and clause analysis with citations.

## Quick start (Docker)

1. Copy env files:
   - `cp .env.example .env` (optional)
   - `cp server/.env.example server/.env` (required)
   - `cp client/.env.example client/.env` (required)
2. Set `OPENAI_API_KEY` and Google OAuth keys if needed.
3. Run: `docker-compose up -d --build`

## URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/swagger/
- Admin: http://localhost:8000/admin/

## Documentation

- `docs/dev_guide.md` - quickstart and local dev
- `docs/ARCHITECTURE.md` - architecture and data flow
- `docs/MAINTENANCE.md` - runbook, hidden assumptions, troubleshooting

## Tech stack

- Frontend: React + Vite + Tailwind
- Backend: Django + DRF
- Async: Celery + Redis
- Storage: SQLite for app data by default, PostgreSQL + pgvector for embeddings

## License

See `LICENSE`.
