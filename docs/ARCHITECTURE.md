# RoadCare — System Architecture

## 1. Overview & Stack

RoadCare is a civic infrastructure issue reporting, AI-assisted road defect detection, and municipal maintenance workflow platform. It is engineered with modern JavaScript, PostgreSQL/Supabase, real-time channels, geospatial indexing, and computer vision.

```
                              [ Citizen / Mobile / Web Browser ]
                                     React 18 + Vite (JS/JSX)
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │ (Direct Auth & Realtime)     │ (Privileged Server API)      │ (Webcam stream / 1 FPS)
                 ▼                              ▼                              ▼
      [ Supabase Cloud / Postgres ]    [ Express JS API ]            [ FastAPI AI Service ]
      ├─ Auth (Email OTP + OAuth)      ├─ Token Verification (JWT)   ├─ YOLOv8 / RDD2022
      ├─ Row Level Security (RLS)      ├─ Role-based Access Control  ├─ Pothole / Crack Detection
      ├─ Storage (Evidence Photos)     ├─ Deterministic Priority     ├─ Confidence & Bounding Box
      ├─ Realtime (Status updates)     ├─ Duplicate Detection        └─ Missing-weights fallback
      └─ Safe Public Map Projection    ├─ Status State Machine
                                       └─ Audit Event Logging
                                                │
                                                ▼
                                    [ Vehicle Edge Agent ]
                                    (Python / OpenCV / RTSP)
```

---

## 2. Core Service Boundaries

### Frontend Web Application
- **Path:** Root (`/`)
- **Technologies:** React 18.3, Vite 5, JavaScript (ES2022 + JSX), Tailwind CSS, shadcn/ui (Radix primitives), React Router 6, TanStack Query 5, Leaflet, Recharts.
- **Role Interfaces:**
  - **Public / Unauthenticated:** Landing page (`/`), Live issue map (`/map`), Auth & OTP verification (`/auth`, `/verify-otp`, `/reset-password`).
  - **Citizen:** Dashboard (`/dashboard`), Report issue with photo & GPS (`/report`), My complaints (`/my-complaints`), Issue details & timeline (`/complaints/:id`), Live camera detection (`/live-detection`), Notifications (`/notifications`), Profile (`/profile`).
  - **Administrator:** Dashboard analytics (`/admin`), Triage & work assignment (`/admin/complaints`), Live issue map (`/map`), Officer workload.
  - **Maintenance Officer:** Field dashboard (`/officer`), Assigned tasks (`/officer/tasks`), Resolution evidence upload (`/officer/tasks/:id`).

### Express Application API
- **Path:** `apps/api/`
- **Language:** Plain JavaScript (Node.js ES modules, no TypeScript).
- **Port:** 5000
- **Responsibilities:** Privileged operations that must never expose the Supabase service-role key to client browsers, including:
  - Token and role verification.
  - State machine transition enforcement (`pending` → `verified` → `in_progress` → `resolved` → `closed`).
  - Deterministic explainable priority score calculation (0–100 scale).
  - Haversine duplicate candidate detection within configurable spatial/temporal windows.
  - Scheduled SLA monitoring and audit logging.

### Road Damage AI / CV Service
- **Path:** `services/road-damage-ai/`
- **Language:** Python 3 + FastAPI.
- **Port:** 8000
- **Responsibilities:**
  - Object detection on road pavement imagery using models fine-tuned on RDD2022.
  - Explicit missing-weights handling (`model_available: false`).
  - Return of normalized bounding boxes, detection labels, confidence, and inference latency.

### Optional Vehicle Camera Agent
- **Path:** `services/vehicle-camera-agent/`
- **Language:** Python 3 + OpenCV.
- **Responsibilities:** Connects to onboard USB/UVC cameras or authorized RTSP streams, samples frames at 1 FPS, calls detection endpoints, and logs candidate events without requiring driver distraction.

---

## 3. Security & Privacy Model

1. **PostgreSQL as Single Source of Truth:** No secondary or conflicting database.
2. **Defense in Depth:**
   - Database Row Level Security (RLS) protects profiles, roles, and complaints.
   - Server-side Express API validates JWT tokens and verifies role ownership before executing any update.
3. **Public Map Privacy Projection:** Unauthenticated map endpoints use `public_complaints_view`, which projects coordinates and defect types without exposing citizen user IDs, phone numbers, or reporter emails.
4. **Zero Client Secrets:** The Supabase Service Role key is strictly server-side (`apps/api/.env`) and never bundled into frontend assets (`VITE_*`).
