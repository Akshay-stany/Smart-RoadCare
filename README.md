# RoadCare

AI-assisted road-damage reporting and civic complaint tracking: citizens report potholes and road damage with a photo and GPS location; administrators triage and assign work; maintenance officers resolve it.

> **Status: work in progress.** See `docs/PROJECT_AUDIT.md` for what exists today and `docs/IMPLEMENTATION_PLAN.md` for the phased roadmap. Features listed in the plan that are not yet built (Google sign-in, officer role, AI detection, duplicate detection) are **not** implemented.

## What works today
- Email/password sign-up and sign-in, password reset (Supabase Auth)
- Report an issue with title, description, photo (client-side compressed) and map location
- Live map with clustering, citizen dashboard, basic admin table and charts
- In-app notifications on status change

## Stack
React 18 · Vite · TypeScript · Tailwind · shadcn/ui · TanStack Query · Leaflet · Recharts · Supabase (Postgres, Auth, Storage, Realtime)

## Run locally
```bash
npm ci
cp .env.example .env     # then fill in YOUR Supabase URL + anon key (never commit .env)
npm run dev              # http://localhost:8080
npm test                 # unit tests
npm run lint
npm run build
```

## Docs
- `docs/PROJECT_AUDIT.md` — architecture, findings, risks
- `docs/IMPLEMENTATION_PLAN.md` — phases and decisions
- `docs/TESTING.md` — what was actually run
- `supabase/proposed/` — security migration awaiting review (not applied)
