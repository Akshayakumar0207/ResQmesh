# ResQMesh — Backend

FastAPI + SQLAlchemy. Runs against local SQLite with zero config, or Supabase Postgres
via a single `DATABASE_URL` env var — no code changes needed either way.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # defaults work as-is for local dev
uvicorn app.main:app --reload
```

API docs (interactive): `http://localhost:8000/docs`
Health check: `http://localhost:8000/api/health`

The database is auto-seeded with demo data (Chennai-area resources/facilities/emergencies)
on first startup.

## Run tests

```bash
pytest -q
```

24 tests covering the Emergency Intelligence Engine, the Resource Matching Algorithm,
API validation, the full assign → dynamic-re-optimization flow, and the auth system.

## What's here

- `app/algorithms/` — Emergency Intelligence Engine (`classification.py`), Resource
  Matching Algorithm (`matching.py`), distance/ETA (`distance.py`). Ported term-for-term
  from the frontend's TypeScript engine so both layers always agree.
- `app/services/coordination.py` — the core business logic: create → classify → match →
  assign → status transitions → **dynamic re-optimization** when a resource drops out
  mid-mission.
- `app/services/broadcast.py` + `app/api/notifications.py` — WebSocket connection
  manager and REST endpoints powering the live "social feed": every connected user is
  pushed a notification the instant anyone posts a new emergency.
- `app/auth/` — JWT issuing/verification, password hashing (bcrypt), FastAPI auth
  dependencies. See `app/api/auth.py` for the endpoints (register, login, Google
  Sign-In, refresh, logout, forgot/reset password).
- `app/models/entities.py` — SQLAlchemy models mirroring `supabase/schema.sql` exactly.
- `app/demo/seed_data.py` — the demo dataset (clearly labeled simulation data).

## Auth summary

- **Access tokens**: short-lived JWT (15 min default), sent as `Authorization: Bearer <token>`.
- **Refresh tokens**: httpOnly cookie, 7 days (30 days with "remember me").
- **Google Sign-In**: verifies Google ID tokens server-side; requires `GOOGLE_CLIENT_ID`
  to be set (see `.env.example`) — the button is hidden on the frontend until configured.
- **Forgot/reset password**: works out of the box without any email provider — in
  `DEMO_MODE`, the reset link is returned directly in the API response instead of
  emailed. Configure `SMTP_*` vars to send real emails via free Gmail app passwords.

## Live notification feed

Connect to `wss://<host>/ws/notifications?token=<access_token>` to receive a JSON
message every time a new emergency is posted:
```json
{"type": "new_emergency", "request_code": "REQ-1067", "severity": "CRITICAL", ...}
```
`GET /api/notifications` returns the persisted history for clients that weren't
connected when a broadcast happened.

## Deployment

See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for the full Supabase → AWS EC2 →
Vercel walkthrough, including systemd/Nginx configs in `deploy/`.
