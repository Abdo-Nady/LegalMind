# LegalMind.ai

**AI-Powered Legal Document Intelligence Platform**

LegalMind.ai is a full-stack web application that transforms how legal professionals interact with documents through conversational AI. Upload legal PDFs, extract insights, identify risks, detect clauses, and generate structured summaries with precise source citations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18.3-blue.svg)
![Django](https://img.shields.io/badge/django-5.2-green.svg)

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [AI Pipeline](#ai-pipeline)
- [Security](#security)
- [License](#license)

---

## Features

### Authentication & Security
- JWT-based authentication with access/refresh tokens
- Google OAuth2 integration
- Password reset via email
- Role-based access control (Admin/User)

### Document Management
- Upload and manage legal PDF documents (up to 50MB)
- Real-time processing status tracking (Uploaded → Processing → Ready)
- Per-user document isolation
- Automatic text extraction and page counting

### Intelligent Document Chat (RAG)
- **Notebook-style interface** for conversing with legal documents
- Context-aware answers grounded in document content
- Source citations linked to specific PDF pages/sections
- Multi-document comparative analysis

### Legal Clause Detection
Automatic identification of key legal clauses:
- Termination clauses
- Confidentiality clauses
- Jurisdiction clauses
- Payment & penalty terms
- Liability & indemnity clauses
- Force majeure provisions

Each clause includes:
- Risk level classification (Low/Medium/High)
- Precise location (page/section references)
- Clear explanations

### Risk & Issue Analysis
- Detection of missing or risky clauses
- Highlighting of ambiguous or weak wording
- Actionable recommendations

### Executive Legal Summaries
One-click contract summaries including:
- Key obligations
- Major risks
- Missing clauses
- Recommended actions
- Exportable formats (PDF/Text)

### Egyptian Law Database
Pre-seeded collection of Egyptian legal documents:
- Egyptian Constitution (2019)
- Labor Law (2025)
- Civil Code
- Penal Code
- Tax Procedures Law

Features:
- Dedicated chat interface for law queries
- Arabic content with full RTL support
- Multi-language responses (Arabic/English)

### User Experience
- Integrated PDF viewer with page navigation
- Modern chat-based interface
- Responsive design for all devices
- Full internationalization (English & Arabic)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| Vite | 5.4.19 | Build Tool |
| TypeScript | 5.6+ | Type Safety |
| Tailwind CSS | 3.4.17 | Styling |
| Radix UI | Latest | Component Library |
| TanStack Query | 5.83.0 | Server State Management |
| React Router | 6.x | Routing |
| react-pdf | 10.2.0 | PDF Rendering |
| Axios | 1.13.2 | HTTP Client |
| Framer Motion | Latest | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 5.2.9 | Web Framework |
| Django REST Framework | 3.16.1 | REST API |
| Simple JWT | 5.5.1 | JWT Authentication |
| dj-rest-auth | 7.0.1 | Auth Endpoints |
| django-allauth | 65.13.1 | OAuth Integration |
| Celery | 5.4.0 | Async Task Queue |
| Django Channels | 4.3.2 | WebSocket Support |
| drf-yasg | 1.21.11 | API Documentation |

### Database & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 16 | Primary Database |
| pgvector | Latest | Vector Embeddings |
| Redis | 7-alpine | Cache & Message Broker |

### AI/ML Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| LangChain | 0.3.0+ | RAG Framework |
| OpenAI GPT-4o-mini | Latest | LLM Reasoning |
| text-embedding-3-large | Latest | Vector Embeddings (1536 dims) |
| PyMuPDF | 1.24.0 | PDF Processing |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container Orchestration |



### RAG Pipeline

```
Document Upload
      │
      ▼
┌─────────────────┐
│  Celery Task    │
│  (Async)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PDF Extraction │ ──▶ │    Chunking     │ ──▶ │   Embedding     │
│  (PyMuPDF)      │     │  (1000 chars)   │     │   (OpenAI)      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │    PGVector     │
                                                │  (Store/Index)  │
                                                └─────────────────┘


---

## Getting Started

### Prerequisites

- **Docker & Docker Compose** (recommended)
- OR: Python 3.11+, Node.js 20+, PostgreSQL 16, Redis 7

### Docker Setup (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/legalmind-ai.git
cd legalmind-ai
```

2. **Configure environment variables**

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration (see Configuration section below)
```

3. **Build and start all services**
```bash
docker-compose up -d
```

4. **Access the application**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/swagger/ |
| Admin Panel | http://localhost:8000/admin |

5. **Create a superuser (optional)**
```bash
docker exec -it documind_server python manage.py createsuperuser
```

#### Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f server

# Stop all services
docker-compose down

# Restart a service
docker-compose restart server

# Rebuild after code changes
docker-compose up -d --build

# Clean restart (deletes all data)
docker-compose down -v && docker-compose up -d

# Access Django shell
docker exec -it documind_server python manage.py shell

# Run migrations manually
docker exec -it documind_server python manage.py migrate
```

### Manual Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/legalmind-ai.git
cd legalmind-ai
```

2. **Set up PostgreSQL with pgvector**
```bash
# Install pgvector extension
# See: https://github.com/pgvector/pgvector#installation

# Create database
createdb legalmind
```

3. **Set up Redis**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
```

4. **Set up the backend**
```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Seed Egyptian laws (optional)
python manage.py seed_egyptian_laws

# Start the server
python manage.py runserver
```

5. **Start Celery worker** (new terminal)
```bash
cd server
source venv/bin/activate
celery -A config worker --loglevel=info
```

6. **Set up the frontend** (new terminal)
```bash
cd client

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory (or use the service-specific `.env` files):

```bash
# ===========================================
# Google OAuth Configuration
# ===========================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ===========================================
# OpenAI API Key (Required for AI features)
# ===========================================
OPENAI_API_KEY=your-openai-api-key

# ===========================================
# PostgreSQL Database Configuration
# ===========================================
DB_NAME=legalmind
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db                    # Use 'localhost' for manual setup
DB_PORT=5432

# ===========================================
# PGVector Connection String
# ===========================================
# Docker: postgresql+psycopg://postgres:postgres@documind_db:5432/legalmind
# Manual: postgresql+psycopg://postgres:postgres@localhost:5432/legalmind
PGVECTOR_CONNECTION_STRING=postgresql+psycopg://postgres:postgres@documind_db:5432/legalmind

# ===========================================
# Email Configuration (for password reset)
# ===========================================
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-smtp-key
DEFAULT_FROM_EMAIL=noreply@legalmind.ai
DEFAULT_FROM_NAME=LegalMind.ai

# ===========================================
# Frontend URL
# ===========================================
FRONTEND_URL=http://localhost:5173

# ===========================================
# Frontend Environment (client/.env)
# ===========================================
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```
---

## Project Structure

```
legalmind-ai/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── api/                     # API client & endpoints
│   │   ├── components/              # Reusable UI components
│   │   │   ├── chat/                # Chat-related components
│   │   │   ├── document/            # Document viewer components
│   │   │   ├── layout/              # Layout components
│   │   │   └── ui/                  # Base UI components (Radix)
│   │   ├── contexts/                # React contexts (Auth, Language)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utilities & helpers
│   │   ├── locales/                 # i18n translations (en/ar)
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.tsx        # Document library
│   │   │   ├── DocumentWorkbench.tsx # Document viewer + chat
│   │   │   ├── EgyptianLaw.tsx      # Law browser
│   │   │   ├── LawWorkbench.tsx     # Law viewer + chat
│   │   │   ├── Login.tsx            # Authentication
│   │   │   └── Settings.tsx         # User settings
│   │   ├── App.tsx                  # Main app component
│   │   └── main.tsx                 # Entry point
│   ├── public/                      # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── server/                          # Django Backend
│   ├── accounts/                    # User authentication app
│   │   ├── models.py                # User & Profile models
│   │   ├── serializers.py           # DRF serializers
│   │   ├── views.py                 # Auth views
│   │   └── urls.py                  # Auth routes
│   ├── ai_api/                      # AI & Document app
│   │   ├── models.py                # Document, Chat models
│   │   ├── views.py                 # Document & chat views
│   │   ├── serializers.py           # DRF serializers
│   │   ├── urls.py                  # API routes
│   │   ├── tasks.py                 # Celery async tasks
│   │   ├── chains/                  # LangChain implementations
│   │   │   ├── legal_rag.py         # RAG chain for documents
│   │   │   ├── clause_detection.py  # Clause detection chain
│   │   │   └── summary.py           # Summary generation chain
│   │   ├── egyptian_laws/           # Egyptian law module
│   │   │   ├── models.py            # Law-specific models
│   │   │   ├── views.py             # Law API views
│   │   │   └── data/                # Pre-seeded law PDFs
│   │   └── management/commands/     # Django commands
│   ├── config/                      # Django configuration
│   │   ├── settings.py              # Django settings
│   │   ├── urls.py                  # Root URL config
│   │   └── celery.py                # Celery configuration
│   ├── media/                       # User uploads
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile
│   └── docker-entrypoint.sh
│
├── docs/                            # Documentation
├── docker-compose.yml               # Docker orchestration
├── .env.example                     # Environment template
└── README.md                        # This file
```


---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [OpenAI](https://openai.com/) for GPT models and embeddings
- [LangChain](https://langchain.com/) for the RAG framework
- [pgvector](https://github.com/pgvector/pgvector) for vector similarity search
- [Radix UI](https://www.radix-ui.com/) for accessible components
- The open-source community

---

## Support

For questions or support:
- Open an [issue](https://github.com/yourusername/legalmind-ai/issues)
- Contact the maintainers

---

<p align="center">
  Built with care for legal professionals
</p>
