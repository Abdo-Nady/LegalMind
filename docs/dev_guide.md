# PawPal Developer Guide

Quick setup guide for new developers.

---

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL (or use SQLite for local dev)
- Redis (for WebSocket/chat features)

---

## Backend Setup

```bash
cd server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

**API:** http://localhost:8000  
**Admin:** http://localhost:8000/admin

---

## Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start dev server
npm run dev
```

**App:** http://localhost:5173

---

## Creating a New App (Backend)

```bash
cd server
source venv/bin/activate

# Create app
python manage.py startapp <app_name>
```

Then in `config/settings.py`:
```python
INSTALLED_APPS = [
    ...
    '<app_name>',
]
```

---

## Project Structure

```
PawPal/
├── client/          # React frontend (Vite)
│   ├── src/
│   └── package.json
├── server/          # Django backend
│   ├── config/      # Project settings
│   ├── manage.py
│   └── requirements.txt
├── docs/            # Documentation
└── docker-compose.yml
```

---

## Useful Commands

| Task | Command |
|------|---------|
| Run backend | `python manage.py runserver` |
| Run frontend | `npm run dev` |
| Make migrations | `python manage.py makemigrations` |
| Apply migrations | `python manage.py migrate` |
| Create app | `python manage.py startapp <name>` |
| Install Python pkg | `pip install <pkg> && pip freeze > requirements.txt` |
| Install Node pkg | `npm install <pkg>` |

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=pawpal
DB_USER=postgres
DB_PASSWORD=postgres
```

---

## Git Workflow

1. Create feature branch: `git checkout -b feature/<name>`
2. Make changes
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/<name>`
5. Open Pull Request
