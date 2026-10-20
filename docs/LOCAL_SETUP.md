# RoadCare — Local Environment Setup Guide

This guide walks through cloning, configuring, and running the RoadCare platform on a local development machine across all four subsystem components:
1. **Frontend Web App** (React 18 + Vite, JavaScript/JSX) — Port `8080`
2. **Backend API** (Node.js + Express, JavaScript ES Modules) — Port `5000`
3. **AI Vision Service** (Python 3.10+ + FastAPI) — Port `8000`
4. **Vehicle Camera Edge Agent** (Python 3.10+ + OpenCV) — Standalone daemon

---

## Prerequisites

- **Node.js:** v18.0.0 or higher (Node v20+ recommended)
- **Python:** v3.10 or higher
- **Package Manager:** `npm` (v9+ or v10+)
- **Git**

---

## 1. Repository Setup & Dependencies

```bash
# 1. Clone repository
git clone <repository-url> roadcare
cd roadcare

# 2. Install root web frontend dependencies
npm install

# 3. Install Express backend dependencies
cd apps/api
npm install
cd ../..

# 4. Install Python AI dependencies
cd services/road-damage-ai
pip install -r requirements.txt
cd ../..

# 5. (Optional) Install Python Vehicle Edge Agent dependencies
cd services/vehicle-camera-agent
pip install -r requirements.txt
cd ../..
```

---

## 2. Environment Configuration

### Frontend Environment (`.env`)
Create `.env` at the repository root:
```ini
# Supabase Client Credentials (Public)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key

# Optional backend and AI service overrides (defaults are preconfigured)
VITE_API_URL=http://localhost:5000/api/v1
VITE_AI_SERVICE_URL=http://localhost:8000
```

### Express Backend Environment (`apps/api/.env`)
Create `apps/api/.env`:
```ini
PORT=5000
NODE_ENV=development
WEB_ORIGIN=http://localhost:8080

# Supabase Server-side Credentials (Privileged service role key)
# WARNING: Never prefix this key with VITE_ or expose it to client code.
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Python AI Service endpoint
AI_SERVICE_URL=http://localhost:8000
```

### Python AI Service Environment (`services/road-damage-ai/.env`)
Create `services/road-damage-ai/.env`:
```ini
PORT=8000
HOST=0.0.0.0
MODEL_PATH=weights/rdd2022_yolov8s.pt
CONFIDENCE_THRESHOLD=0.35
IOU_THRESHOLD=0.45
```
*(Note: If weights are absent, the service starts safely and reports `model_available: false` with complete status metadata).*

### Vehicle Camera Edge Agent Environment (`services/vehicle-camera-agent/.env`)
Create `services/vehicle-camera-agent/.env`:
```ini
API_URL=http://localhost:5000/api/v1
AUTH_TOKEN=your-service-account-jwt-or-api-key
CAMERA_INDEX=0
SAMPLE_FPS=1.0
CONFIDENCE_THRESHOLD=0.40
VEHICLE_ID=VEHICLE-MUNI-042
CAMERA_ID=CAM-FRONT-UVC
SAVE_SNAPSHOTS=true
```

---

## 3. Database Schema & Migration Setup

RoadCare uses Supabase / PostgreSQL. All schema changes are versioned in `supabase/migrations/`:
- `20260331160728_remote_schema.sql` (Baseline remote schema)
- `20261020000000_roadcare_core_schema.sql` (Role extension, categories, departments, status history, AI analyses, detection events, audit logs, and public view)

To apply migrations to your local or hosted Supabase project:
```bash
# Using Supabase CLI (if installed)
supabase db push

# Or via Supabase Dashboard SQL Editor:
# Execute the contents of supabase/migrations/20261020000000_roadcare_core_schema.sql
```

---

## 4. Running the Subsystems

### Running Everything Concurrently
You can start individual services in separate terminal tabs:

#### Terminal 1 — Web Frontend (Port 8080)
```bash
npm run dev
# Accessible at http://localhost:8080
```

#### Terminal 2 — Express API (Port 5000)
```bash
npm run dev:api
# Accessible at http://localhost:5000/api/v1/health
```

#### Terminal 3 — Python FastAPI AI Service (Port 8000)
```bash
npm run dev:ai
# Accessible at http://localhost:8000/docs
```

#### Terminal 4 (Optional) — Vehicle Camera Edge Agent
```bash
python services/vehicle-camera-agent/agent.py
```

---

## 5. Verification & Testing

Verify that all components are healthy and passing all automated test suites:
```bash
# Run all automated tests (Vitest + Node Express API tests + Python AI tests)
npm run test:all

# Run code linter
npm run lint

# Build production bundle
npm run build
```
