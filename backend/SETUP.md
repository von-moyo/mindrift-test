# Backend Setup (Edge/BFF, Commerce, Ops)

This project uses Python 3.13, FastAPI, SQLite, and Alembic. Each service runs independently.

## Prerequisites
- Python 3.13 installed
- SQLite available (macOS includes `sqlite3` by default)

## Create a virtual environment
```bash
# From repo root
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
python -V  # should show 3.13.x
```

## Install dependencies
Install per service (you can install all if you plan to run all services):
```bash
pip install -r edge_bff/app/requirements.txt
pip install -r commerce/app/requirements.txt
pip install -r ops/app/requirements.txt
```

## Configure environment
Copy `.env.example` to `.env` in each service folder and adjust values as needed.
```bash
cp edge_bff/app/.env.example edge_bff/app/.env
cp commerce/app/.env.example commerce/app/.env
cp ops/app/.env.example ops/app/.env
```

Defaults are fine for local dev:
- Edge/BFF on port 8000, proxies to Commerce (8001) and Ops (8002)
- Commerce uses SQLite at `commerce.db` in its app folder
- Ops uses SQLite at `ops.db` in its app folder

## Run services (development)
In separate terminals:
```bash
# Edge/BFF
uvicorn edge_bff.app.main:app --reload --port 8000

# Commerce
uvicorn commerce.app.main:app --reload --port 8001

# Ops
uvicorn ops.app.main:app --reload --port 8002
```

Health checks:
- http://localhost:8000/health
- http://localhost:8001/health
- http://localhost:8002/health

Metrics (Edge/BFF):
- http://localhost:8000/metrics

## API Gateway routes
Edge/BFF proxies to downstream services:
- `/api/auth/*`, `/api/catalog/*`, `/api/cart/*`, `/api/orders/*`, `/api/stock/*` → Commerce
- `/api/analytics/*`, `/api/notifications/*` → Ops

Example:
- `GET http://localhost:8000/api/catalog/` → `GET http://localhost:8001/catalog/`

## Database & Alembic
Alembic is configured per service.

Commerce:
```bash
cd commerce
alembic -c alembic.ini upgrade head
alembic -c alembic.ini downgrade -1
cd ..
```

Ops:
```bash
cd ops
alembic -c alembic.ini upgrade head
alembic -c alembic.ini downgrade -1
cd ..
```

## Logging
- Console logs: human-readable key=value style
- File logs: rotating files under `logs/edge_bff.log`, `commerce.log`, `ops.log` (created on first write)
- Request ID is propagated via `X-Request-ID` header

## Troubleshooting
- If imports fail, ensure your venv is activated and dependencies are installed.
- If SQLite file isn’t created, the app will create it on first DB connect; ensure the process has write permissions to the service app folder.
- Update ports/base URLs in the `.env` files to avoid conflicts.
