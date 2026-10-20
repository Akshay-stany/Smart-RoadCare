# RoadCare — Testing Record

Only things that were **actually executed** are listed as passing. Environment: Node v22.22.2, npm 10.9.7, Linux sandbox without Docker/Postgres and without network access to the hosted Supabase project.

## Phase 1 — baseline (code as received)

| Command | Result |
|---|---|
| `npm ci` | ✅ 515 packages |
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ 0 errors (note: `strict` is off) |
| `npx eslint .` | ❌ 15 errors, 10 warnings |
| `npx vite build` | ✅ |
| `npx vitest run` | ✅ 1 test (placeholder only) |
| `npm audit --omit=dev` | ⚠️ 20 advisories (18 high, 2 moderate) — not yet triaged |

## Phase 2 — after repairs

| Command | Result |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ 0 errors |
| `npx eslint .` | ✅ 0 errors, 10 warnings (all `react-refresh/only-export-components` in shadcn/ui files and `useAuth.tsx`; left as-is) |
| `npx vite build` | ✅ |
| `npx vitest run` | ✅ 4 files, 15 tests: `getErrorMessage` (4), `suggestPriority` keyword rule (4), `RequireAuth` guard (6), placeholder (1) |
| `pglast.parse_sql` on `supabase/proposed/20261019_harden_rls.sql` | ✅ parses (10 statements) — **syntax only**; never run against a database |

## Not tested (and why)

- **Anything against the live Supabase project** — unreachable from the sandbox. The route guard, the unfiltered-dashboard fix and the admin-only profile query are unit/compile-checked only; they have not been exercised in a browser against real data.
- **The proposed RLS migration** — not executed; needs a staging Supabase project.
- **Playwright** — `playwright.config.ts` imports `lovable-agent-playwright-config`, which is not in `package.json`. Not runnable as shipped; to be replaced in Phase 13.
- **Browser UI / visual comparison with the reference** — not yet started (Phase 3).
- **`npm audit` findings** — not triaged or fixed.

## Reproduce

```bash
npm ci
npx tsc -p tsconfig.app.json --noEmit
npx eslint .
npx vitest run
npx vite build
```
