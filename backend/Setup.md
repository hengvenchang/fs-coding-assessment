## 🧩 Backend Setup (Short)

### Prereqs
- Python 3.12+
- Docker (for Postgres)
- uv installed

### Quick Start
```bash

uv sync
cp .env.example .env

docker compose -f compose.yaml up -d db
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

API: http://localhost:8000
DB: postgres://postgres:5up3r53cr3t@localhost:5432/todo_db

### Tests
```bash
uv run pytest
```