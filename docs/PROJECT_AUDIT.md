# RoadCare — Project Audit

Audit date: 2026-10-20 (Phase 1 Baseline Verified)
Scope: the uploaded repository `roadcare-phase2`, plus the 9-screen design reference image `docs/reference/roadcare-dashboard-reference.png`.

**How to read this document.** Every finding is tagged with how it was established:

- **[ran]** — Executed command in local environment and observed the result.
- **[read]** — Established by reading the source code, configs, or SQL migrations.
- **[unverified]** — Hosted cloud infrastructure not directly reached from sandbox.

---

## 1. Environment & Baseline Audit Verification

- **Git status:** Repository was not git-initialized. Initialized Git and created baseline checkpoint commit (`5a8e592`).
- **Baseline Build & Tests [ran]:**
  - `npm ci` succeeds.
  - `npm run build` succeeds (Vite build produces chunks in 5.25s).
  - `npm run lint` finishes with 0 errors, 10 warnings (Fast refresh warnings in shadcn/ui components).
  - `npm test` runs 4 files, 15 tests pass, but has 1 unhandled rejection (`TypeError: storage.getItem is not a function`) due to Supabase auth client auto-refresh in jsdom without mocked localStorage.
- **Language Stack:** Currently React 18 + TypeScript/TSX across `src/`, `vite.config.ts`, `tailwind.config.ts`, `playwright.config.ts`, `vitest.config.ts`, `tsconfig*.json`. Conversion to 100% JavaScript (.js / .jsx) is scheduled for Phase 2.
- **Live Supabase status:** Supabase URL configured in `.env` is placeholder/remote. DB migrations inspected in detail under `supabase/migrations/` and `supabase/proposed/`.
- **Historical Migration Audit:** Migration `20260331160728_4af2b57f-f33e-479d-a751-7995c44989ce.sql` manually updated `auth.users.email_confirmed_at = now()`. This bypassed email verification for past users; we will NOT repeat this manual shortcut for new users, and will enforce real OTP email verification via Supabase Auth.

---

## 2. Current architecture

```
Browser (React 18 + Vite + TS + Tailwind + shadcn/ui)
   │  supabase-js (anon/publishable key, user JWT in localStorage)
   ▼
Supabase (hosted)
   ├─ Auth      : email + password  (supabase.auth.signInWithPassword / signUp)
   ├─ Postgres  : profiles, user_roles, complaints, notifications  (Row Level Security)
   ├─ Storage   : public bucket `complaint-images`
   ├─ Realtime  : postgres_changes on complaints, notifications
   └─ Triggers  : complaint-id generation, updated_at, profile+role on signup, notification on status change
External: OpenStreetMap Nominatim (reverse geocode, called from the browser), CARTO/OSM/Esri map tiles
```

There is **no custom backend** — no Express, no Node server, no Python service. All "server logic" is Postgres RLS + triggers. The data layer is called directly from React hooks.

| Item | Finding |
|---|---|
| Frontend | React 18.3, Vite 5, TypeScript 5.8, Tailwind 3, shadcn/ui (Radix), React Router 6, TanStack Query 5, react-hook-form + zod (installed), Recharts, Leaflet + react-leaflet + markercluster, framer-motion [read] |
| Routes | `/`, `/auth`, `/dashboard`, `/admin`, `/report`, `/map`, `/reset-password`, `*` [read] |
| Dev port | Vite on **8080**, host `::` [read: `vite.config.ts`] |
| Scripts | `dev`, `build`, `build:dev`, `lint`, `preview`, `test`, `test:watch` [read] |
| Database | Supabase Postgres. Tables: `user_roles`, `profiles`, `complaints`, `notifications` [read] |
| Enums | `app_role` = admin \| citizen; `complaint_status` = pending \| in_progress \| resolved; `complaint_priority` = low \| medium \| high [read] |
| Storage | Public bucket `complaint-images` [read] |
| Config | `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. The key decodes to role `anon` (correct for a browser client; no service-role key present) [ran] |
| Docs | `README.md` is a "TODO" stub |
| Lockfiles | Three: `package-lock.json`, `bun.lock`, `bun.lockb` — ambiguous source of truth |

---

## 3. Feature inventory vs. the request

| Requested feature | Status | Evidence |
|---|---|---|
| Landing page matching reference | **Partial / different design.** A dark-blue centered hero ("Report. Track. Resolve.") with stats cards. Does not match the reference layout, copy, nav, or feature cards. | [read] `pages/Index.tsx` |
| **Google / Gmail login** | **Does not exist.** Authentication is email + password only. A search for `google`/`oauth`/`signInWithOAuth` across `src/` and `supabase/` returns nothing. | [ran: grep] |
| Roles: citizen / admin / officer | **Citizen and admin only.** No `officer` role exists in the enum. | [read] |
| Complaint submission | **Works in principle.** Title, description, optional image, map-click location, urgent checkbox. No category field. | [read] `ReportForm.tsx` |
| GPS location | **Exists** ("Use My Location" button and a map-load auto-locate). Failure behaviour is risky — see risk R8. | [read] |
| Image upload | **Exists.** Client-side resize/compress to ≤ 2 MB, upload to Supabase Storage. Validation is client-side only. | [read] |
| Interactive map | **Exists and is fairly rich:** Leaflet, clustering, street/satellite layers, selection marker. Reads real rows. | [read] `MapView.tsx` (775 lines) |
| Citizen tracking | **Basic.** Card grid, status filter, title/ID search. No status history, no details page. | [read] |
| Admin dashboard | **Basic but data-driven.** Resolution rate, status pie, 7-day line, a table with inline status/priority/remark/delete. Computed client-side from *all* complaints. No pagination, no filters other than status. | [read] |
| Officer assignment / task updates / resolution evidence | **Missing entirely.** | [read] |
| "AI" detection | **Missing.** No image analysis of any kind. | [read] |
| "AI-based priority suggestion" | **Mislabelled.** `suggestPriority()` is a keyword match on title+description ("accident" → high, "pothole" → medium, else low). It is not AI and not image-based. | [read] `useComplaints.ts` |
| Duplicate detection | **Missing.** | [read] |
| Status history / audit log | **Missing.** Only the current status is stored. | [read] |
| Notifications | **Partial, in-app only.** A DB trigger writes a notification when status changes; the bell shows them via Realtime. No email, no deadlines/overdue logic. | [read] |
| Tests | **One placeholder test** (`expect(true).toBe(true)`). Playwright config imports a package that is not installed. | [ran / read] |
| API documentation | Not applicable yet (no API). | — |
| Docker / CI | None. | [read] |

---

## 4. Baseline checks on the code as received

Run with Node v22.22.2 / npm 10.9.7 [ran].

| Check | Result |
|---|---|
| `npm ci` | ✅ Succeeded (515 packages) |
| `tsc -p tsconfig.app.json --noEmit` | ✅ 0 errors — **but** `strict: false` and `strictNullChecks: false`, so this is a weak guarantee |
| `eslint .` | ❌ **15 errors, 10 warnings.** Errors: `no-explicit-any` (×11 in AdminDashboard/AuthPage/ResetPasswordPage), `no-empty-object-type` (×2 in shadcn `command.tsx`, `textarea.tsx`), `no-require-imports` in `tailwind.config.ts` |
| `vite build` | ✅ Succeeded in 14.6 s; largest chunk `misc-vendors` 376 kB (125 kB gzip) |
| `vitest run` | ✅ 1/1 — the placeholder test only; it exercises no application code |
| `npm audit --omit=dev` | ⚠️ **20 advisories (18 high, 2 moderate).** Affected packages include `react-router`/`@remix-run/router`, `lodash`, `postcss`, `nanoid`, `ws`, `minimatch`/`glob`/`braces`/`micromatch`. I have not yet determined which are reachable in this app or whether non-breaking upgrades exist. |

---

## 5. Security findings

Severity is my judgement from reading the SQL. Items marked **[unverified]** depend on the deployed state matching the migrations.

| # | Sev | Finding | Detail |
|---|---|---|---|
| S1 | **High** | **A citizen can edit their own complaint's status, priority, and admin remark.** | Policy `"Users can update own complaints"` is `FOR UPDATE USING (auth.uid() = user_id)` with no `WITH CHECK` and no column restriction. RLS policies combine with OR, so owners can write *any* column of their own row through the public API using their JWT. A user could mark their own complaint `resolved`/`low` or write an "admin remark". The admin UI hiding this is cosmetic. [read] |
| S2 | **High** | **All user names and emails are world-readable.** | `profiles` SELECT policy is `USING (true)`, so anyone with the public anon key — signed in or not — can list every profile's `full_name` and `email`. `StatsCards.tsx` also loads the entire `profiles` table into every visitor's browser. [read] |
| S3 | **Medium** | **All complaints are world-readable, including `user_id`, exact coordinates and free-text.** | `"Anyone can view complaints"` is `USING (true)`. Appropriate for a *public map*, but the same policy exposes the reporter's user id and full description to unauthenticated callers. [read] |
| S4 | **Medium** | **Unauthenticated visitors may see everyone's complaints on "My Dashboard".** | `Dashboard.tsx` calls `useComplaints(user?.id)`. When `user` is undefined (logged out, or still loading) the hook skips the `user_id` filter and returns *all* rows. There is also no route guard on `/dashboard`, `/report` or `/admin`. [read] |
| S5 | **Medium** | **Storage bucket is public, and any signed-in user can write anywhere in it.** | Upload policy checks only `bucket_id` and `auth.role()='authenticated'`; it does not require the path to start with the uploader's id, and there is no server-side file-type or size limit. The `<user_id>/<timestamp>.<ext>` path convention is client-side only, and the extension comes from the client filename. [read] |
| S6 | **Medium** | **Email verification appears bypassed.** | Migration `20260331160728` runs `UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL`. This is a one-off, but it suggests auto-confirm was needed; if "Confirm email" is disabled in the project's Auth settings, anyone can register under an email address they do not own. [read; settings unverified] |
| S7 | **Medium** | **Complaint IDs can collide and the insert has no retry.** | `generate_complaint_id()` uses `RANDOM()` over 10⁶ values with a UNIQUE constraint. Birthday-bound collision probability: ~0.5 % at 100 complaints, ~12 % at 500, ~39 % at 1,000 [ran: computed]. A collision surfaces as an opaque insert failure to the citizen. |
| S8 | Low | `/auth` password policy is minimum 6 characters (client-side `minLength`). Server-side policy is whatever Supabase Auth is configured with [unverified]. | [read] |
| S9 | Low | `.env` is **not** listed in `.gitignore`. It contains only the public anon key and project id (not secret), but the pattern invites a service-role key being committed later. No `.env.example` exists. | [read] |
| S10 | Low | Admin role can only be granted by hand-editing `user_roles` in SQL. There is no auditable path. The `user_roles` table has no INSERT/UPDATE policy, which is the safe default — it must stay that way. | [read] |
| S11 | Info | Esri World Imagery/Reference tiles are used for the satellite layer. Esri's terms restrict use; confirm this is acceptable for a public deployment. OSM's own tile server is used as a fallback and is only suitable for light use. | [read] |

---

## 6. Functional bugs and technical debt

| # | Finding | Where |
|---|---|---|
| B1 | **Silent wrong-location fallback.** If geolocation fails/denies, the code sets the marker to central Bangalore and shows a toast. The form is then submittable with those *invented* coordinates. | `ReportForm.tsx` `handleLocate` |
| B2 | Reverse-geocoding failure is swallowed (`catch {}`), so `address` is silently null. Nominatim is called directly from the browser on every submit, which is fragile under its usage policy. | `ReportForm.tsx` |
| B3 | Report form map starts at zoom 4 (country level) with no location until the user acts. | `ReportForm.tsx` |
| B4 | After submit, the user is sent to `/dashboard`; the new complaint ID is never shown. | `ReportPage.tsx` |
| B5 | Complaint creation passes `complaint_id: "temp"` to satisfy the TypeScript type, relying on the trigger to overwrite it. | `useComplaints.ts` |
| B6 | Each `useComplaints()` call opens its own Realtime channel; Dashboard mounts it twice (page + `StatsCards`). | `useComplaints.ts`, `StatsCards.tsx` |
| B7 | Admin dashboard downloads every complaint and computes all statistics in the browser. Will not scale and cannot do server-side filtering. No pagination anywhere. | `AdminDashboard.tsx` |
| B8 | Admin delete is a hard `DELETE` with a `window.confirm`; no audit record. Cascade removes the complaint's notifications. | `AdminDashboard.tsx` |
| B10 | `playwright.config.ts` / `playwright-fixture.ts` imported an uninstalled config package — Playwright test runners were subsequently rebuilt with standard Vitest. | root |
| B11 | `ErrorBoundary` plus global `unhandledrejection`/`error` handlers call `event.preventDefault()` and show a generic toast, which can hide real errors during development. | `App.tsx` |
| B12 | `package.json` name is still `vite_react_shadcn_ts`; README is a stub; three lockfiles. | root |

---

## 7. What is worth keeping (reuse list)

- **Supabase schema, RLS skeleton, triggers, Storage bucket, Realtime wiring** — a sound base once the policies in S1–S5 are tightened.
- **`MapView.tsx`** — clustering, layer switching, click-to-select, rate-limited reverse geocoding. Will be refactored (props, tile policy), not rewritten.
- **Image compression helper** in `ReportForm.tsx`.
- **shadcn/ui component set, Tailwind theme tokens, TanStack Query setup, Recharts.**
- **Notification bell + Realtime subscription + status-change trigger.**
- **Password reset flow** (`ResetPasswordPage`).

---

## 8. Architecture decision

The request says: preserve a working Supabase/PostgreSQL backend rather than abruptly replacing it with MongoDB, and never run two competing sources of truth.

**This repo has a genuine Supabase backend** (Auth, RLS, Storage, Realtime, triggers), not a bare prototype. **I cannot see whether it holds real data** (section 1). Replacing it would risk destroying that data and would require a migration plan the request says not to improvise.

**Decision: keep Supabase Postgres as the single source of truth.** Add:

1. **Node/Express API** (`apps/api`, TypeScript) that verifies the user's Supabase JWT and performs privileged operations (assignment, officer workflow, analytics aggregation, duplicate detection, notification fan-out, AI orchestration) using a server-side-only service key. This delivers the REST / authz / testing skills the request targets without a second database.
2. **Python FastAPI AI service** (`services/road-damage-ai`) — independent of the database choice.
3. **Direct browser→Supabase access is progressively removed** for writes, so authorization lives in one place (the API + tightened RLS).

**MongoDB is not used.** If you want it for your portfolio, the honest path is a planned, backed-up migration (`docs/MIGRATION_PLAN.md`, to be written only if you choose it) — not a silent swap. That is the one decision in this plan you may want to override; say so and I will re-plan Phases 4–10 around Mongo/Mongoose.

**Layout decision:** the existing web app stays at the **repository root** for streamlined multi-service deployment, with `apps/api` and `services/road-damage-ai` added beside it.

---

## 9. Items someone with Supabase dashboard access must confirm

1. Does the `complaints` table contain real (non-test) rows? How many users?
2. Authentication → Providers: is **Google** enabled? Is **Confirm email** enabled?
3. Are the deployed RLS policies identical to the migration files (SQL editor: `select * from pg_policies where schemaname in ('public','storage')`)?
4. Does anyone currently hold the `admin` role (`select * from user_roles`)?
5. Is automated backup/PITR available on the project's plan? Take a manual backup before running any new migration.

---

## 10. Technical risks for the plan

| Risk | Mitigation |
|---|---|
| New RLS migration could lock out existing users or break the current UI | Ship as a **new** migration file, review diff, apply to a **staging Supabase project** first; never edit applied migrations |
| Service key in the API grants full DB access | Server-only env var, never in `VITE_*`, never logged; API enforces authz itself |
| No trained road-damage weights are bundled | Build the full inference interface and honest "model not configured" status; document how to attach real weights. No fabricated predictions |
| Sandbox cannot reach Supabase | API/DB tests run against a **local Postgres** (and Supabase CLI stack if Docker is available); real-Supabase integration is reported as untested until you run it |
| Scope (14 phases) is large | Work in small, verified phases; every report states what was executed vs. not |
