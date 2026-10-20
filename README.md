# RoadCare — Civic Infrastructure Issue Reporting & AI Maintenance Platform

RoadCare is a civic infrastructure issue reporting, AI-assisted road defect detection, and municipal maintenance workflow platform. Citizens report potholes, road cracks, broken footpaths, and street hazards with photo evidence and GPS coordinates; municipal administrators triage and assign tasks; field maintenance officers perform repairs, upload before/after completion evidence, and resolve civic complaints.

The application reproduces the design system and workflows shown in `docs/reference/roadcare-dashboard-reference.png`.

---

## Key Capabilities

1. **Exact Visual System Matching Reference:**
   - Dark navy sidebar (`#0B1328`), emerald green primary actions (`#10B981`), crisp white/slate cards, and responsive layout.
   - All 9 reference screens built as dedicated React routes (Landing, Auth, Issue Reporting, AI Results, Live Map, My Complaints, Admin Analytics, Complaint Details with Timeline, Officer Update & Resolve).
2. **100% JavaScript / JSX (Zero TypeScript):**
   - Pure modern JavaScript across the frontend, backend Express API, tests, configs, and scripts.
   - Fast Vite builds (~4.98s) with optimized code splitting.
3. **Robust Backend Architecture (Not MERN):**
   - **Database & Auth:** Supabase PostgreSQL, Supabase Auth with 6-digit Email OTP, Supabase Storage, and Realtime.
   - **Express API (`apps/api/`):** Privileged Node.js + Express backend in plain JavaScript for role enforcement, audit trails, and server-side state transitions.
   - **Deterministic Priority Scorer:** Transparent 0–100 scoring based on defect severity, traffic density, and proximity cluster frequency.
   - **Duplicate Detection Engine:** Spatial Haversine distance matching with configurable radius and temporal filtering.
4. **AI-Assisted Road Damage Detection:**
   - **Python FastAPI Service (`services/road-damage-ai/`):** Object detection for potholes, cracks, and surface damage mapped to the RDD2022 dataset classes.
   - **Honest Missing-Weights Behavior:** Returns `model_available: false` when weights are unconfigured rather than fabricating fake detections.
   - **Live Webcam / USB Camera Mode (`/live-detection`):** Browser-based frame throttling at 1 FPS with GPS tagging and bounding box overlays.
   - **Optional Vehicle Edge Agent (`services/vehicle-camera-agent/`):** Local Python edge daemon for streaming USB or authorized RTSP camera feeds.

---

## System Architecture & Ports

| Service | Technology | Port | Directory |
|---|---|---|---|
| **Web Frontend** | React 18, Vite, Tailwind CSS, Leaflet, Recharts | `http://localhost:8080` | `src/` |
| **Express Backend** | Node.js, Express, Supabase Admin Client, Zod | `http://localhost:5000` | `apps/api/` |
| **AI Vision Service** | Python 3.10+, FastAPI, OpenCV, PyTorch | `http://localhost:8000` | `services/road-damage-ai/` |
| **Vehicle Edge Agent** | Python 3.10+, OpenCV, Requests | Standalone daemon | `services/vehicle-camera-agent/` |

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd apps/api && npm install && cd ../..

# Python AI dependencies
cd services/road-damage-ai && pip install -r requirements.txt && cd ../..
```

### 2. Configure Environment Variables
Copy the template files:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp services/road-damage-ai/.env.example services/road-damage-ai/.env
```
Update `.env` and `apps/api/.env` with your Supabase URL, anon key, and server service-role key. (See `docs/LOCAL_SETUP.md` for parameter definitions).

### 3. Apply Forward-Only Database Migration
Apply `supabase/migrations/20261020000000_roadcare_core_schema.sql` to your Supabase project via the Supabase CLI (`supabase db push`) or the Supabase Dashboard SQL Editor.

### 4. Run the Platform
Start each subsystem in its own terminal:

```bash
# Terminal 1: Web Frontend (Port 8080)
npm run dev

# Terminal 2: Express Backend API (Port 5000)
npm run dev:api

# Terminal 3: FastAPI AI Service (Port 8000)
npm run dev:ai
```

---

## Available Scripts

- `npm run dev` — Starts the Vite frontend dev server at `http://localhost:8080`.
- `npm run dev:api` — Starts the Express API server at `http://localhost:5000`.
- `npm run dev:ai` — Starts the Python FastAPI AI vision server at `http://localhost:8000`.
- `npm run test` — Runs frontend Vitest tests (15 tests).
- `npm run test:api` — Runs backend Express API tests (5 tests).
- `npm run test:ai` — Runs Python AI service tests (3 tests).
- `npm run test:all` — Executes all 23 automated tests across frontend, backend, and AI service.
- `npm run lint` — Runs ESLint on all project JavaScript files (0 errors).
- `npm run build` — Generates optimized production bundle in `dist/`.

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Comprehensive technical architecture and subsystem interactions.
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — Detailed PostgreSQL schema, tables, relationships, and RLS policies.
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — REST API endpoint specs, request/response schemas, and auth requirements.
- [`docs/SUPABASE_AUTH_SETUP.md`](docs/SUPABASE_AUTH_SETUP.md) — 6-digit Email OTP setup, email template, and role security.
- [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md) — Step-by-step developer guide for a fresh clone.
- [`docs/TESTING.md`](docs/TESTING.md) — Complete record of executed tests, passing status, and boundaries.
- [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md) — Initial codebase audit, findings, and technical debt resolution.
- [`services/road-damage-ai/MODEL_CARD.md`](services/road-damage-ai/MODEL_CARD.md) — Computer vision model card, RDD2022 class mapping, and license disclosure.
