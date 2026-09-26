# ResQMesh — Frontend

React + Vite + TypeScript + Tailwind CSS + Leaflet. Runs fully standalone on local demo
data — no backend or database required to explore the app.

## Run locally

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start dev server with hot reload
- `npm run build` — type-check (`tsc -b`) then production build to `dist/`
- `npm run preview` — preview the production build

## Structure

See the top-level [`../README.md`](../README.md) for the full project overview and
architecture. Key folders:

- `src/algorithms/` — Emergency Intelligence Engine (`classification.ts`), Resource
  Matching Algorithm (`matching.ts`), and distance/ETA (`distance.ts`)
- `src/store/useAppStore.ts` — the in-browser coordination engine (create → classify →
  match → assign → status transitions → dynamic re-optimization)
- `src/data/` — demo dataset (Chennai-area resources/facilities/emergencies + 3 demo
  scenarios), clearly labeled simulation data
- `src/pages/` — all routes (Landing, Command Center, Request, Provider, Demo, Analytics…)
