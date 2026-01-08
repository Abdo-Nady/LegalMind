# Graduation Project Roadmap
**Timeline**: 3 weeks (21-25 days) 

## Setup & Roles
**Setup**: Git repo + branch protection, Python 3.10+, Node 16+, PostgreSQL 12+, Docker + docker-compose, Linters (Black, ESLint, Prettier)

**Roles** (rotate each sprint): Backend (Django models, DRF APIs, auth, tests), Frontend (React components, routing, API integration), DevOps (CI/CD, Docker, deployment), Product Lead (user stories, backlog, ceremonies)

## Agile with Jira (3 Sprints × 1 Week)
**Jira**: Scrum board, issue types (Story/Task/Bug), labels (backend/frontend/devops), link to GitHub

**Workflow**: Backlog → Sprint Backlog → In Progress → In Review → Done

**Ceremonies**: Sprint Planning → Daily Standup (10min) → Sprint Review/Demo → Retro

**Git**: Branch `PROJ-123-feature-name`, commits `PROJ-123: description`, PRs link Jira

**Per Sprint**: 2-3 stories, adjust velocity after Sprint 1

## User Stories
**Template**: As a [user], I want [goal] so that [reason]. **AC**: GIVEN/WHEN/THEN or bullets

**Examples**: Auth (register/login for access), CRUD (create/edit/delete items), Permissions (owner-only access), Search (find items quickly)

## Database Design & Build (PostgreSQL)
**Schema Design**: Identify core entities (Users, main resource, related) → Normalize (3NF) → Use FKs → Add indexes on FKs and queried fields → Timestamps on all tables

**Example**:
- `users(id, email UNIQUE, password_hash, created_at)`
- `items(id, owner_id FK→users, title, body, status, created_at, updated_at)`
- `comments(id, item_id FK→items, user_id FK→users, body, created_at)`

**Django Setup**: Configure `DATABASES` in settings.py → `python manage.py makemigrations` → `python manage.py migrate` → Keep migrations small/linear

**Backups**: Schedule DB dumps or use managed backups

## Backend (Django + DRF)
**Structure**: Apps per domain (users, items, comments) → models.py, serializers.py, views.py

**Auth**: djangorestframework-simplejwt (JWT tokens)

**Endpoints** (`/api/v1/`): Auth (register, login, refresh) | CRUD (GET, POST, PATCH, DELETE `/items/`, `/items/:id/`)

**Validation**: DRF serializers | **Permissions**: IsAuthenticated, IsOwnerOrReadOnly | **Pagination**: PageNumberPagination

**Testing**: pytest + pytest-django | **Docs**: drf-spectacular (OpenAPI/Swagger)

## Frontend (React)
**Structure**: `src/components/`, `src/pages/`, `src/services/api/`, `src/hooks/`, `src/context/`, `src/styles/`

**Routing**: react-router-dom | **State**: Context API + useReducer (or Redux) | **API**: axios with interceptors (JWT + 401 handling)

**Forms**: react-hook-form + Yup | **Auth**: JWT in memory/httpOnly cookies | **Styling**: Tailwind/CSS Modules

**Testing**: Jest + React Testing Library | **Responsive**: Mobile-first

## Dev Workflow & Testing
**Git**: Branch `PROJ-123-feature`, PR with Jira link, 1+ review, branch protection on main

**Quality**: Black + Flake8 (Python), ESLint + Prettier (JS), pre-commit hooks

**CI/CD**: GitHub Actions on PR → lint, test, build → block merge if fail

**Review Checklist**: ✅ Runs locally ✅ Tests pass ✅ No secrets ✅ Readable ✅ Docs updated ✅ Jira-linked

**Testing**: pytest (backend), Jest + RTL (frontend), Cypress (E2E optional), factory_boy (fixtures), 60-80% coverage

## Deployment & Security
**Docker**: Dockerfile (Django + React), docker-compose local | **Env**: `.env` local (not committed), env vars in production

**Hosting**: Render/Heroku (backend + DB), Vercel/Netlify (frontend) OR single platform

**Production**: ✅ HTTPS ✅ CORS whitelist ✅ `/health` endpoint ✅ Migrations on deploy ✅ DB backups

**Security**: Server-side validation, Django ORM (SQL injection protection), secure JWT, strong passwords, rate limiting, never commit secrets

## Documentation & Deliverables
**Docs**: README (setup, run, test, deploy), API docs (OpenAPI/Swagger), architecture diagram (React ↔ Django ↔ PostgreSQL), demo video (5-10 min)

**Deliverables**: ✅ Deployed app ✅ GitHub repo (clean history, Jira PRs) ✅ README + API docs ✅ Passing CI + tests ✅ Demo video ✅ Final report

## MVP Scope
**Must-Have**: Auth (JWT signup/login), ONE resource with full CRUD, list + pagination, owner-only permissions, responsive UI

**Should-Have**: Search/filter, validation (frontend + backend), error handling, unit tests (auth + CRUD), CI pipeline

**Nice-to-Have**: Secondary resource (comments), file upload, E2E tests

**Non-Negotiable**: Deployed app, README, API docs, passing tests, demo video, Jira-linked commits

## Timeline (3 Weeks / 1-Week Sprints)
**Sprint 1 (Days 1-7)**: Jira setup, user stories, repo, dev env (Day 1-2) → Scaffolding, DB schema, migrations, auth, deploy (Day 3-7) | **Goal**: Auth working, deployed

**Sprint 2 (Days 8-14)**: Main resource CRUD (API + UI), permissions, validation, unit tests, API integration | **Goal**: Full CRUD deployed

**Sprint 3 (Days 15-21/25)**: UI polish, search/filter, tests, CI/CD (Day 15-18) → README, API docs, demo video (Day 19-20) → Final fixes, submission (Day 21-25) | **Goal**: Production-ready with docs

**Daily**: 4-6 hours focused development per person

## Submission Checklist
[ ] Migrations + seed in README [ ] README: setup, test, deploy [ ] API docs (OpenAPI) [ ] CI passing [ ] Deployed URL [ ] Tests passing

## Best Practices
Small testable stories | Deliver incrementally | Commit early, push often | PRs for all changes | Security + simple UX over fancy features | Ask Supervisor when blocked | Use Jira daily
