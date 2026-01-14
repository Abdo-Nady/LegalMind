# DocuMind Architecture

## Intent

DocuMind focuses on legal document analysis with RAG. The core product goal is to let users upload PDFs and ask questions with citations. It is not a full document management system or a multi-tenant SaaS platform.

## System overview

```
[React/Vite UI]
      |
      v
[Django DRF API] ----> [SQLite (app data)]
      |
      +--> [Celery worker] --> [PGVector in Postgres (embeddings)]
      |                         |
      |                         +--> [OpenAI API]
      |
      +--> [Redis] (Celery broker + rate-limit cache)
      |
      +--> [Filesystem] (uploaded PDFs + static law PDFs)
```

## Core components

- Client (React): pages in `client/src/pages`, shared UI in `client/src/components`.
- API (Django DRF): two apps, `accounts` for auth and `ai_api` for document workflows.
- Async processing: Celery handles PDF extraction, chunking, and embedding generation.
- RAG pipeline: LangChain configuration in `server/ai_api/langchain_config.py`.

## Data stores and responsibilities

- SQLite (default): primary app data such as users, documents, sessions, and messages.
- PostgreSQL + pgvector: vector store for embeddings. This is separate from the Django DB.
- Redis: Celery broker and DRF throttle cache.
- Filesystem: raw PDFs and extracted assets (`server/media`, `server/egyptian_laws/pdfs`).

## Key flows

### 1) Document upload and processing

1. User uploads a PDF (`DocumentUploadView`).
2. A `Document` row is created and set to `processing`.
3. Celery task `process_pdf_document` extracts text, splits into chunks, and stores:
   - `DocumentChunk` rows for citations/debugging.
   - embeddings in PGVector for retrieval.
4. Document status changes to `ready`; the UI polls until this happens.

### 2) Document chat (RAG)

1. UI sends a question to `/ai/documents/<id>/chat/`.
2. The server retrieves top chunks from PGVector and runs a prompt chain.
3. The answer and sources are stored in `ChatMessage` and returned to the UI.

### 3) Egyptian law documents

1. Law PDFs are seeded on container startup with `seed_egyptian_laws`.
2. Each law is stored in `EgyptianLaw` and chunked into `EgyptianLawChunk`.
3. Law-specific chat uses an Arabic-focused retrieval strategy (MMR).

## Decisions and trade-offs

- SQLite for core data keeps local setup simple, but embeddings live in Postgres. This split reduces initial friction but adds two data stores to operate.
- Chunks are stored both in the DB and in PGVector. The DB copy supports citations and debugging; PGVector is optimized for retrieval.
- Tokens are stored in localStorage for simplicity, which is not ideal for high-security deployments. Consider httpOnly cookies for production.
- The law seed list is duplicated in the frontend and backend to keep UI metadata and server seed data aligned.

## Extension points

- Add a new analysis type: add a chain in `langchain_config.py`, expose it in `ai_api/views.py`, and add a client method in `client/src/services`.
- Add a new law: update the seed list in `server/ai_api/management/commands/seed_egyptian_laws.py`, add the PDF to `server/egyptian_laws/pdfs`, and update `client/src/data/egyptianLawDocuments.js`.
