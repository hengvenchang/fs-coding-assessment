# Full Stack TODO Application

A TODO application with FastAPI backend and Next.js frontend, featuring JWT authentication, PostgreSQL database, and comprehensive testing.

---

## 🚀 Quick Setup

### Prerequisites

- **Python 3.12+** and **uv** (backend)
- **Node.js 22+** (frontend)
- **Docker** (for PostgreSQL)

### Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Configure environment
cp .env.example .env

# Start PostgreSQL
docker compose up -d db

# Run migrations
uv run alembic upgrade head

# Start API server
uv run uvicorn app.main:app --reload
```

**API:** http://localhost:8000  
**Database:** postgres://postgres:5up3r53cr3t@localhost:5432/todo_db

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Start dev server
npm run dev
```

**App:** http://localhost:3000

---

## 🧪 Running Tests

**Backend:**
```bash
cd backend
uv run pytest
```
---

## 📋 Project Requirements

- **Backend**: [`backend/README.md`](./backend/README.md) - FastAPI, PostgreSQL, JWT auth
- **Frontend**: [`frontend/README.md`](./frontend/README.md) - Next.js, state management, optimistic UI

---

## 📦 Tech Stack

**Backend:** FastAPI · SQLModel · PostgreSQL · Alembic · Pytest  
**Frontend:** Next.js 15 · React · TypeScript · Tailwind CSS · shadcn/ui

---
