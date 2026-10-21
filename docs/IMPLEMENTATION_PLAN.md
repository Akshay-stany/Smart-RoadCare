# RoadCare — Implementation Plan

Companion to `PROJECT_AUDIT.md`. Architecture: **keep Supabase Postgres as the single source of truth**; add a TypeScript Express API and a Python FastAPI AI service (see audit §8).

```
React (root, Vite) ──► Express API (apps/api) ──► Supabase Postgres/Storage (service key, server-only)
        │                     └──► FastAPI AI service (services/road-damage-ai)
        └──► Supabase Auth (Google + email/password) — user JWT is verified by the API
```

## Ground rules (apply to every phase)

- Never edit `.env`. Add `.env.example` files; real secrets stay untracked.
- Never edit an already-applied migration. New SQL = new file in `supabase/migrations/`, reviewed and applied to a staging project before production, after a backup.
- Each phase ends with: code, executed checks, fixes, and an honest record in `docs/TESTING.md` (command, result, what was *not* tested).
- No fabricated AI output, statistics, or "passing" tests. Seeded data is labelled demo.

## Phases

| # | Goal | Main changes | Verification | Exit criteria |
|---|---|---|---|---|
| **1** | Audit | `docs/PROJECT_AUDIT.md`, this plan, reference image in `docs/reference/` | Baseline `tsc/eslint/build/test/audit` | ✅ Done |
| **2** | Repair & foundation | ✅ `.gitignore` (+`.env*`, uploads), `.env.example`, 15 lint errors fixed, package renamed, real Vitest tests, README, `RequireAuth` route guard, `Dashboard` unfiltered-query fix, admin-only profile loading, no more silent Bangalore location fallback, **proposed** RLS/ID migration in `supabase/proposed/` (not applied). **Deferred/unchanged:** Playwright config (→ Phase 13), lockfile consolidation (your call), `strict` TS mode (→ Phase 3+), npm-audit triage | `tsc`, `eslint`, `vite build`, `vitest` all run — see `docs/TESTING.md` | ✅ Done (live-Supabase behaviour untested) |
| **3** | Design system, landing, login, layouts | Tokens from reference (navy sidebar, green primary), `PublicLayout/CitizenLayout/AdminLayout/OfficerLayout`, Landing, Login (Google button + email), shared Sidebar/TopBar/StatCard/StatusBadge/EmptyState/ErrorState | Component tests, build, visual check vs reference | Screens 1–2 recreated; routes real |
| **4** | API foundation | `apps/api`: Express+TS, env validation (zod), Helmet/CORS/rate-limit, Supabase JWT middleware, role middleware, error handler, pino logging, `/api/v1/health`, `/auth/me` | Supertest + Vitest; boot test | Auth/role tests pass |
| **5** | Complaint submit | Schema migration (category, geo, `complaint_code` generator w/o collisions, status history, audit log), `POST /complaints`, upload validation (magic-bytes, size), storage adapter, `/report` page (React Hook Form + Zod, map correction, denied-GPS handling) | API tests incl. malformed/oversized/wrong-type uploads | Row persisted; ID shown after server confirm |
| **6** | List, details, history | `GET /complaints`, `/:id`, pagination/search/sort, My Complaints, Complaint Details + timeline | Ownership tests (citizen A cannot read B) | Screens 6 + details |
| **7** | Map | `/complaints/map`, `/nearby` (PostGIS or bbox+haversine), filters, public payload without PII, Leaflet page from reused `MapView` | Geo query tests | Screen 5 |
| **8** | Admin | Aggregation endpoints, dashboard, complaint management, officer assignment, transition rules, audit log | Aggregation tests vs known fixture | Screens 7–8 |
| **9** | Officer | `officer` role, task endpoints, evidence upload, resolution flow | Authz tests (unassigned = 403) | Screen 9 |
| **10** | Notifications | Notification table extension, in-app + SMTP (Mailpit locally), overdue job w/ idempotency key | Job idempotency test | No duplicate sends on restart |
| **11** | AI service | FastAPI `/health`, `/analyze-image`; model loader reads `MODEL_PATH`; explicit `model_available:false` when absent; API proxy + save analysis; "DEMO MODE" only if explicitly enabled and labelled | pytest: health, bad image, missing model, (real inference only if weights supplied) | Honest status in UI |
| **12** | Priority, duplicates, analytics | Rule-based scorer (0–100 + factor explanation); duplicate finder (radius + time + category + optional pHash); analytics polish | Table-driven unit tests | Documented formulas |
| **13** | Hardening | Security review pass, e2e journey (Playwright), CI workflow, Dockerfiles/compose | Full suite; build | CI green locally |
| **14** | Docs & seed | ARCHITECTURE, DATABASE_SCHEMA, API_DOCUMENTATION, LOCAL_SETUP, TESTING, README, idempotent labelled seed script | Fresh-clone setup dry run | Acceptance checklist |

## Phase 2 detail (executing next)

**Files changed:** `.gitignore`, `package.json`, `eslint.config.js`, `tailwind.config.ts`, `src/pages/{AdminDashboard,AuthPage,ResetPasswordPage,Dashboard}.tsx`, `src/components/ReportForm.tsx`, `src/components/ui/{command,textarea}.tsx`, `src/App.tsx`, `README.md`.
**Files added:** `.env.example`, `src/components/RequireAuth.tsx`, `src/lib/*.test.ts`, `supabase/proposed/20261019_harden_rls.sql` (**proposed only — not under `migrations/`, so it cannot be applied by accident**), `docs/TESTING.md`.
**Not touched:** `.env`, existing migrations, `src/integrations/supabase/*` (generated).

## Environment variables (final architecture)

| File | Variables |
|---|---|
| `/.env` (web, public values only) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL` |
| `apps/api/.env` | `PORT`, `NODE_ENV`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `SUPABASE_JWT_SECRET` or JWKS URL, `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`, `UPLOAD_MAX_BYTES`, `SMTP_HOST/PORT/USER/PASSWORD/FROM` |
| `services/road-damage-ai/.env` | `MODEL_PATH`, `MODEL_NAME`, `MODEL_VERSION`, `CONFIDENCE_THRESHOLD`, `SERVICE_TOKEN`, `DEMO_MODE` (default false) |
| Supabase dashboard (not in repo) | Google OAuth client ID/secret; redirect URL |

Defaults: web 8080 (existing; 5173 only if you prefer — Vite config is the single place to change), API 5000, AI 8000.

## Open questions for you (non-blocking; defaults chosen)

1. **Database:** default = keep Supabase PostgreSQL.
2. **Google OAuth:** configured via Google Cloud OAuth client + provider in Supabase.
