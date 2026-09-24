# Contributing to BloodConnect

## Prerequisites

- Python 3.12+
- Node.js 20+
- MongoDB 7 (local or Docker)

## Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env

cd ../frontend
cp .env.example .env
npm install
```

Optional demo data:

```bash
cd backend && source .venv/bin/activate
export MONGODB_URI=mongodb://127.0.0.1:27017/bloodconnect
export JWT_SECRET=dev_jwt_secret_change_in_production_min_32_chars
python -m scripts.seed
```

## Verify environment

```bash
export MONGODB_URI=...
export JWT_SECRET=...
./scripts/check-env.sh
```

## Tests

From repo root:

```bash
npm test
```

Backend only:

```bash
cd backend && .venv/bin/python -m pytest
```

## API docs

When the backend is running: [http://localhost:5001/docs](http://localhost:5001/docs)

## Conventions

- Backend: FastAPI routers under `backend/app/routers`, shared logic in `backend/app/services`
- Frontend: Expo Router screens in `frontend/app`, shared types in `frontend/types`
- API role `hospital` is labeled **Recipient** in the mobile UI
