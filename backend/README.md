# Temple Billing Backend (Flask + SQLite)

## Setup (Windows / PowerShell)

```powershell
Set-Location "f:\Temple Billing\backend"
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

## Seed demo data (creates `database.db`)

```powershell
Set-Location "f:\Temple Billing\backend"
.\.venv\Scripts\python seed.py
```

Seeded login:
- **username**: `admin`
- **password**: `admin123`

## Run

```powershell
Set-Location "f:\Temple Billing\backend"
.\.venv\Scripts\python app.py
```

Backend runs at `http://127.0.0.1:5000`.

## Key API endpoints

- `POST /api/auth/login`
- `GET /api/poojas`
- `GET /api/inventory` (JWT)
- `POST /api/bills/create` (JWT)
- `GET /api/bills/history` (JWT)
- `GET /api/dashboard/summary` (JWT)
- `GET /api/dashboard/chart?range=30` (JWT)

