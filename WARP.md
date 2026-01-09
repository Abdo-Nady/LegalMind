# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Branch & Entry Points
- Primary working branch: `dev` (tracks `origin/dev`). Prefer opening PRs against `dev` unless otherwise specified.
- Frontend root: `client/` (Vite + React).
- Backend root: `server/` (Django REST Framework project `config`, apps `accounts` and `ai_api`).
- Top-level orchestration: `docker-compose.yml` defines `db`, `pgvector`, `redis`, `server`, and `client` services.

## Common Commands

All commands assume the working directory is the repo root (`DocuMind/`).

### Docker-based workflow (recommended)
- Start full stack (db, pgvector, redis, Django API, React client):
  - `docker-compose up -d`
- View logs for all services:
  - `docker-compose logs -f`
- Restart a single service (e.g. backend):
  - `docker-compose restart server`
- Stop all services:
  - `docker-compose down`
- Clean restart (removes volumes/data):
  - `docker-compose down -v && docker-compose up -d`
- Create Django superuser inside the running backend container:
  - `docker exec -it documind_server python manage.py createsuperuser`

URLs (when using Docker defaults):
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/swagger/`
- Django admin: `http://localhost:8000/admin/`

### Frontend (client)
From `client/`:
- Install deps: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Development-mode build (uses Vite `--mode development`): `npm run build:dev`
- Lint JS/JSX: `npm run lint`

Single-test guidance: there is no test script defined in `client/package.json`; if tests are added later, prefer running them via `npm test` or a dedicated script if present.

### Backend (server)
From `server/` (manual, non-Docker workflow):
- Create & activate venv (Unix):
  - `python -m venv venv && source venv/bin/activate`
- Install deps:
  - `pip install -r requirements.txt`
- Apply migrations:
  - `python manage.py migrate`
- Run development server:
  - `python manage.py runserver`

Tests:
- There is no dedicated test runner script documented; default Django tests can be run from `server/` with:
  - `python manage.py test`
- To run tests for a single app:
  - `python manage.py test accounts`
  - `python manage.py test ai_api`

## High-Level Architecture

### Overall system
DocuMind is a full-stack RAG-based legal document assistant:
- React/Vite frontend in `client/` provides authentication, dashboard, document workbench, Egyptian law library, and chat UI.
- Django REST backend in `server/` exposes authentication endpoints (`accounts` app) and AI/RAG endpoints (`ai_api` app).
- PostgreSQL in `db` stores core relational data; `pgvector` service is used for vector-based semantic search via PGVector.
- Redis is used for Django Channels/WebSockets support (channels and channels_redis in `requirements.txt`).
- LangChain + OpenAI provide embeddings and LLM reasoning for legal analysis workflows.
- Celery (with Redis broker) and `server/ai_api/tasks.py` are used for background PDF processing (chunking + embedding).

### Frontend structure (client)
Key points (JS/JSX app, using Vite aliases):
- Entry file: `client/src/main.jsx` bootstraps React and imports global styles.
- Root component: `client/src/App.jsx` wires up:
  - React Router (`BrowserRouter`, `Routes`, `Route`) with routes for:
    - `/` → landing/marketing (`Index` page, public route)
    - `/login` → auth (`Login` page, public route, wrapped in `PublicRoute`)
    - `/forgot-password` and `/reset-password` → password reset flow (public, via `PublicRoute`)
    - `/dashboard` → main document dashboard (protected)
    - `/egyptian-law` → Egyptian law library (protected)
    - `/egyptian-law/:lawId` → preloaded Egyptian law document workbench (protected, reuses `DocumentWorkbench`)
    - `/document/:id` → generic uploaded-document workbench/chat (protected)
    - `/settings` → user/account settings (protected)
    - `*` → `NotFound` page
  - Route guards:
    - `ProtectedRoute` wraps authenticated pages.
    - `PublicRoute` wraps public pages (e.g. redirects if already logged in).
  - Global providers:
    - `QueryClientProvider` from `@tanstack/react-query` for data fetching/caching.
    - `AuthProvider` from `@/contexts/AuthContext` for auth state and JWT handling.
    - `LanguageProvider` from `@/contexts/LanguageContext` for i18n.
    - `TooltipProvider`, `Toaster`, and `Sonner` for UI/notifications.
- Internationalization:
  - `client/src/lib/i18n.js` configures `i18next` + `react-i18next` with language detection (localStorage + navigator).
  - Translation JSON files live in `client/src/locales/en.json` and `client/src/locales/ar.json`.
- PDF export utilities:
  - `client/src/lib/pdf-export.js` exports `exportToPDF(content, title, type, documentName)` which renders markdown-like content (insights/summary) into a styled A4 PDF using `jsPDF`.
  - Intended for exporting AI analysis (clause insights, executive summaries) from the document workbench.
- UI components live under `client/src/components/` and use shadcn-ui + Tailwind CSS; Tailwind is configured in `client/tailwind.config.js` and `client/src/index.css`.
- API-client logic and React Query hooks are organized under `client/src/lib/` and `client/src/services/` (conventions: centralize axios config and server URLs there).

Important implications for agents:
- Prefer adding new routes via `client/src/App.jsx` and colocating page components under `client/src/pages/`.
- Use the existing `AuthContext` and React Query client (`@/lib/queryClient`) for any new API calls instead of ad-hoc fetches.
- Reuse `exportToPDF` for any new report/summary downloads instead of rolling your own PDF generator.
- When adding user-visible text, wire it through `react-i18next` and update both `en.json` and `ar.json`.

### Backend structure (server)

#### Django project
- Project root: `server/`.
- Main project package: `server/config/` with:
  - `settings.py`: configures installed apps, REST framework, JWT auth, social auth, Swagger, CORS, and SQLite/PG databases.
    - Custom user model: `AUTH_USER_MODEL = "accounts.User"` (be mindful when referencing the user model in new code).
    - REST framework default auth: `JWTAuthentication` via `rest_framework_simplejwt`.
    - `REST_AUTH` configured to use custom serializers in `accounts.serializers`.
    - Social login via Google provider in `allauth` using `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars.
    - CORS allows Vite dev origins on ports `5173` and `127.0.0.1:5173`.
    - Media: `MEDIA_URL` and `MEDIA_ROOT` defined for uploaded files.
  - `urls.py`: routes:
    - `admin/` → Django admin.
    - `api/accounts/` → `accounts.urls` (auth/profile endpoints).
    - `api/ai/` → `ai_api.urls` (RAG/document endpoints).
    - `swagger/` → drf-yasg UI with JWT bearer auth configured.
  - `asgi.py` / `wsgi.py`: standard Django entrypoints (ASGI used for channels/Redis).

#### Accounts app (`server/accounts`)
- Handles user-facing account APIs, built on the custom `User` model and a related `Profile` model.
- `views.py` key classes:
  - `UserProfileView` (`RetrieveUpdateAPIView`): get/update current user profile (e.g. name, avatar URL).
  - `ChangePasswordView` (`APIView`): POST endpoint to change password using `ChangePasswordSerializer`.
  - `UploadAvatarView` (`APIView`): handles avatar upload and deletion:
    - Validates content type and size (`ALLOWED_IMAGE_TYPES`, `MAX_AVATAR_SIZE`).
    - Replaces old avatar files on upload; deletes avatar on DELETE.
- Serializers in `accounts/serializers.py` integrate with `dj-rest-auth` (`CustomUserDetailsSerializer`, `CustomRegisterSerializer`).
- Adapters in `accounts/adapters.py` plug into `allauth`/`dj-rest-auth` for custom signup/login behavior (e.g. Google OAuth handling).

Agents adding account-related features should:
- Reuse existing serializers and `UserProfileView` pattern.
- Respect JWT-based auth and `AUTH_USER_MODEL` when querying or extending user data.

#### AI/RAG app (`server/ai_api`)
Core of the document intelligence feature set.

Key models (in `ai_api/models.py`):
- `Document`: uploaded PDFs with metadata (user, title, status, page_count, file path, processed timestamps).
- `DocumentChunk`: per-document text segments with `chunk_index` and `page_number` for traceable citations.
- `ChatSession`: per-user sessions tied to a single `Document`, with title and timestamps.
- `ChatMessage`: messages in a chat session (roles `user`/`assistant`, content, and stored `sources`).

Key views (in `ai_api/views.py`):
- `DocumentUploadView`:
  - Endpoint: `POST /api/ai/documents/upload/`.
  - Parses PDF file and metadata via `DocumentUploadSerializer`.
  - Uses `PyPDFLoader` from `langchain_community` to load pages.
  - Cleans `\x00` NUL bytes from content before storing (PostgreSQL compatibility).
  - Splits content with `get_text_splitter()` and stores each chunk as `DocumentChunk`.
  - Persists chunks to PGVector using `get_document_vector_store(doc.id).add_documents(...)`.
  - Sets `Document.status` to `'processing'` → `'ready'` and updates `processed_at`.
- `DocumentListView` / `DocumentDetailView`:
  - List documents for the authenticated user and retrieve/delete individual ones.
  - `perform_destroy` ensures both vector-store entries and file storage are cleaned up via `delete_document_vectors`.
- `DocumentChatView`:
  - Endpoint: `POST /api/ai/documents/<id>/chat/`.
  - Validates input (`query`, optional `session_id`) with `ChatQuerySerializer`.
  - Creates or reuses `ChatSession`; stores `ChatMessage` for both user and assistant.
  - Calls `get_document_vector_store(doc.id)` and `get_legal_rag_chain(vector_store)` to run RAG.
  - Returns answer text and a simplified `sources` array (content snippet, page number, chunk index).
- `DocumentClauseDetectionView`:
  - Endpoint: `POST /api/ai/documents/<id>/clauses/`.
  - Ensures `doc.status == 'ready'`.
  - Uses `get_clause_detection_chain(vector_store)` with a fixed prompt to analyze key legal clauses and risk levels.
- `DocumentSummaryView`:
  - Endpoint: `POST /api/ai/documents/<id>/summary/`.
  - Uses `get_summary_chain(vector_store)` to generate high-level executive summaries.
- `ChatSessionListView` / `ChatSessionDetailView`:
  - List and manage chat sessions for the current user.

#### LangChain configuration (`server/ai_api/langchain_config.py`)
Centralizes AI and vector-store wiring:
- Models and constants:
  - Embedding model: `text-embedding-3-small`.
  - Chat model: `gpt-4o-mini`.
  - Chunk size/overlap and retrieval parameters (`CHUNK_SIZE`, `CHUNK_OVERLAP`, `RETRIEVAL_K`).
- `get_connection_string()`:
  - Uses Django `settings.DATABASES['default']` to build a PG connection string.
  - For SQLite dev, prefers `PGVECTOR_CONNECTION_STRING` env var; otherwise falls back to local `postgresql+psycopg://postgres:postgres@localhost:5432/documind`.
- `get_openai_api_key()`:
  - Reads `OPENAI_API_KEY` from env; raises if missing (so any agent calling RAG chains must ensure this is configured).
- `get_embeddings()` / `get_llm()`:
  - Wrap OpenAI embeddings and chat model instances using the configured models and API key.
- `get_vector_store()` / `get_document_vector_store()`:
  - Provide a PGVector-based store, usually scoped per-document via collection names like `document_<id>`.
- Chain builders:
  - `get_legal_rag_chain(vector_store)`: constructs retrieval + prompt + LLM chain returning both `answer` and `retrieved_docs`.
  - `get_clause_detection_chain(vector_store)`: builds a clause-analysis chain with structured instructions for risk analysis.
  - `get_summary_chain(vector_store)`: builds an executive-summary chain with guidance on overview, key terms, dates, financials, risks, and recommendations.
- `delete_document_vectors(document_id)`: deletes the PGVector collection for a given document; called during document deletion.

#### Celery & background processing (`server/ai_api/tasks.py`)
- Celery is configured in `config/settings.py` to use Redis (`CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND`).
- `ai_api.tasks.process_pdf_document(document_id)` encapsulates async PDF processing:
  - Loads the PDF from disk, sanitizes NUL bytes, splits into chunks via `get_text_splitter()`, bulk-creates `DocumentChunk` rows, and adds documents to the PGVector store.
  - Updates `Document.status` (`processing` → `ready` / `failed`) and `processed_at`.
- When adding new heavy AI workflows, prefer implementing them as Celery tasks alongside `process_pdf_document`.

Agents modifying AI behavior should:
- Prefer editing prompts and model parameters in `langchain_config.py` to keep behavior centralized.
- Preserve the contract that `get_legal_rag_chain` returns `answer` and `retrieved_docs`, as `DocumentChatView` depends on this.

## Notes for Future Agents
- Use Docker Compose for the fastest end-to-end setup; manual backend/frontend setup is mostly for debugging.
- Any new endpoints should be namespaced under `api/accounts/` or `api/ai/` and added to `config/urls.py` via the respective app `urls.py`.
- When handling files (documents, avatars), respect the existing `MEDIA_ROOT`/`MEDIA_URL` configuration and cleanup patterns used in `UploadAvatarView` and `DocumentDetailView.perform_destroy`.
