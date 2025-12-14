# 🐾 PawPal — Pet Care Platform

A full-stack platform connecting pet owners with vet clinics, enabling pet care services, buying/selling pets & products, consultation booking, and an AI-powered pet assistant.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React |
| **Backend** | Django + Django REST Framework |
| **Database** | PostgreSQL |
| **Real-time** | Django Channels (WebSocket) |
| **Cache** | Redis |
| **AI** | Gemini 1.5 / GPT-4o mini |

---

## Project Structure

```
PawPal/
├── client/          # React frontend
├── server/          # Django backend
├── docker/          # Dockerfiles & scripts
├── docs/            # Documentation
├── .env             # Environment variables (not committed)
├── .env.example     # Template for .env
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### 1. Clone & Setup Environment

```bash
git clone https://github.com/Abdo-Nady/PawPal.git
cd PawPal
cp .env.example .env
# Edit .env with your keys
```

### 2. Run with Docker

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **Admin:** http://localhost:8000/admin/

### 3. Run Locally (without Docker)

#### Backend
```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd client
npm install
npm start
```

---

## Features

- 🔐 JWT Authentication
- 👤 User & Clinic Profiles
- 🐕 Pet Management & Mating Requests
- 🛒 Product Marketplace (Admin Approved)
- 📅 Consultation Booking
- 💬 Real-time Private Chat
- 🤖 AI Pet Assistant (Vision + Text)
- 📍 Location-based Clinic Search
- ⭐ Ratings & Reviews

---

## Documentation

See the [`docs/`](./docs/) folder for:
- API Reference
- Database Schema
- Architecture Overview

---

## License

MIT License — see [LICENSE](./LICENSE)
