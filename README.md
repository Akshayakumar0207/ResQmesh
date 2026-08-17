# ResQMesh — AI-Powered Emergency Resource Coordination Network

**Prototype for LT HackFest 2026.**
*"ResQMesh doesn't just find help. It intelligently coordinates the resources already around us."*

> Prototype for emergency coordination and community resource allocation.
> **In a real emergency, contact official emergency services.**

---

## Current build status

This repo is being built in phases. **Backend, auth, and live notifications: complete.**

| Phase | Status |
|---|---|
| Architecture & folder structure | ✅ |
| Frontend (React + Vite + Tailwind + Leaflet) | ✅ Complete, runs standalone with local demo data |
| Emergency Intelligence Engine (classification) | ✅ Implemented in both frontend (TS) and backend (Python) — kept in sync |
| Resource Matching Algorithm | ✅ Implemented in both frontend (TS) and backend (Python) |
| Command Center, Demo Mode, all pages/routes | ✅ |
| Backend (FastAPI) | ✅ Full API, dynamic re-optimization, auto-seed |
| Database (Supabase Postgres schema + SQLite local) | ✅ `backend/supabase/schema.sql` — switches via `DATABASE_URL` |
| Auth — JWT, Google Sign-In, remember me, forgot/reset password | ✅ |
| Live broadcast notifications (WebSocket "social feed") | ✅ Every posted emergency pushes to all connected users instantly |
| Testing suite | ✅ 24 backend tests (`pytest`) — classification, matching, API, auth |
| Deployment docs (Supabase + AWS EC2 + Vercel) | ✅ `docs/DEPLOYMENT.md` |
| Full docs (ARCHITECTURE.md, API.md, PITCH.md, JUDGE_QA.md) | ⏳ Next phase |

**Important:** the frontend does not need the backend to work. It ships with a full local
coordination engine (classification + matching + dynamic re-optimization) so the entire
product — including the Command Center and Demo Mode — is demoable right now, offline,
with zero setup beyond `npm install`.

---

## Quick start

**Frontend only (zero setup, works fully standalone):**
```bash
cd frontend
npm install
npm run dev
```

**Full stack (real backend + auth + live notifications):**
```bash
# Terminal 1 — backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
cp .env.example .env
# edit .env: VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). Without the backend
running, every page still works using local demo data — no `.env`, no database, no API
keys required to explore the app.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full Supabase → AWS EC2 → Vercel
production deployment guide.

---

## What's in this repo right now

```
resqmesh/
├── frontend/                  # React + Vite + TS + Tailwind + Leaflet — fully functional
│   ├── src/
│   │   ├── algorithms/        # Emergency Intelligence Engine + Matching Engine + distance/ETA
│   │   ├── components/        # PriorityBadge, MatchCard, MapView, NetworkVisualization, etc.
│   │   ├── data/               # Demo dataset — Chennai-area resources, facilities, scenarios
│   │   ├── layouts/            # AppLayout (dashboard shell), PublicLayout
│   │   ├── pages/               # Landing, Command Center, Request, Provider, Demo, Analytics...
│   │   ├── store/               # useAppStore.ts — the live in-browser coordination engine
│   │   ├── types/               # Shared TypeScript domain model
│   │   └── utils/               # Formatting/style helpers
│   ├── .env.example
│   └── package.json
├── backend/                    # FastAPI backend — next phase
├── docs/                        # ARCHITECTURE.md / API.md / DEMO.md / PITCH.md / JUDGE_QA.md — next phase
└── README.md                    # this file
```

---

## Core idea

Emergencies don't usually lack nearby help — they lack **coordination**. Volunteers with
vehicles, pharmacies, hospitals, shelters, and skilled individuals already exist around
almost every incident. ResQMesh classifies each incoming request (category, severity,
priority), scores every available resource against it (urgency fit, distance, compatibility,
availability, ETA), assigns the best one, and — the key differentiator — **automatically
re-optimizes the network** if that resource becomes unavailable mid-mission.

## Tech stack (zero paid dependencies)

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Leaflet + OpenStreetMap, Zustand, Recharts
- **Routing:** OSRM public demo server, with instant Haversine-distance fallback
- **AI/Intelligence:** fully local — weighted keyword/NLP scoring, no hosted LLM API required
- **Backend (next phase):** FastAPI + Pydantic
- **Database (next phase):** Supabase PostgreSQL free tier (SQLite for local dev)
- **Hosting:** Vercel (frontend), Render (backend), Supabase (DB) — all free tiers

## Run it in VS Code

```bash
# 1. Open the project
code resqmesh

# 2. Open an integrated terminal (Ctrl+` / Cmd+`) and run:
cd frontend
npm install
npm run dev
```

VS Code will show a "Open in Browser" prompt on the printed `localhost` link, or press
`Cmd+Click` / `Ctrl+Click` on it in the terminal. Recommended extensions: **ESLint**,
**Tailwind CSS IntelliSense**, **ES7+ React snippets**.

Useful scripts (run from `frontend/`):

```bash
npm run dev        # start local dev server with hot reload
npm run build       # type-check + production build → frontend/dist
npm run preview     # preview the production build locally
```

## Deploying (free tiers only)

**Frontend → Vercel:**
```bash
npm i -g vercel
cd frontend
vercel
```
Set the root directory to `frontend` when prompted (or in the Vercel dashboard). No
environment variables are required for the demo build.

Backend and database deployment instructions will be added once those phases land.

## License / data notice

All location, resource, and emergency data in this repository is **fictional simulation
data** generated for demo purposes, placed near real Chennai localities for geographic
realism only. It is not a directory of real hospitals, shelters, or emergency contacts.
