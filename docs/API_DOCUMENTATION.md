# RoadCare Express API Documentation (v1)

The RoadCare Application API is a secure Node.js + Express backend written entirely in JavaScript (ES modules) under `apps/api/`. It provides server-side authorization, privileged database operations via Supabase service-role key, audit trails, deterministic priority calculation, duplicate detection, and orchestration for AI computer-vision services.

---

## Base URL & Port Conventions

- **Default Port:** `5000` (`http://localhost:5000`)
- **API Prefix:** `/api/v1`
- **Frontend Web Origin:** `http://localhost:8080` (or `http://localhost:5173`)
- **FastAPI AI Service:** `http://localhost:8000`

---

## Security & Authentication Architecture

1. **Token Verification:**
   All authenticated endpoints require an `Authorization: Bearer <supabase_access_token>` header. The token is validated using `supabase.auth.getUser(token)`.
2. **Role Verification:**
   The caller's role is extracted from the `public.user_roles` table (or fallback `public.profiles` role column) and matched against permitted roles (`citizen`, `officer`, `admin`).
3. **No Browser Exposure:**
   The `SUPABASE_SERVICE_ROLE_KEY` is only used inside `apps/api/` and is never bundled in frontend code or Vite client bundles.
4. **Anti-Abuse Protections:**
   - **Helmet:** Secure HTTP headers (CSP, HSTS, X-Content-Type-Options).
   - **Rate Limiting:** 300 requests per 15-minute window per IP.
   - **Payload Limits:** 10MB JSON and multipart payload ceilings.
   - **Request ID Tracking:** Every request is assigned a unique `X-Request-Id` for tracing and log auditing.

---

## Endpoints Specification

### 1. System Health

#### `GET /api/v1/health`
Checks server liveness, Node environment, and Supabase configuration status.
- **Auth:** Public
- **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "RoadCare Express API",
  "version": "2.0.0",
  "uptimeSeconds": 142,
  "timestamp": "2026-10-20T10:25:00.000Z",
  "environment": "development",
  "supabaseConfigured": true
}
```

---

### 2. User & Authentication

#### `GET /api/v1/auth/me`
Retrieves authenticated user details and resolved database role.
- **Auth:** Bearer Token (Citizen, Officer, Admin)
- **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
    "email": "user@example.com",
    "role": "citizen",
    "fullName": "Jane Doe",
    "emailConfirmedAt": "2026-10-20T08:30:00.000Z",
    "createdAt": "2026-10-20T08:25:00.000Z"
  }
}
```

---

### 3. Complaints & Issue Management

#### `GET /api/v1/complaints/map`
Returns public-safe complaint coordinates and statuses for the interactive map. Excludes reporter PII (emails, phone numbers, internal audit notes).
- **Auth:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "a90b4391-4567-4221-a1d2-b677a29e1201",
      "complaint_id": "RC-1024",
      "title": "Severe pothole on main road",
      "category": "pothole",
      "department": "Roads & Highways",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "Indiranagar, Bengaluru, Karnataka",
      "status": "in_progress",
      "priority": "high",
      "is_urgent": true,
      "image_url": "https://supabase.../pothole.jpg",
      "created_at": "2026-10-20T08:00:00.000Z"
    }
  ]
}
```

#### `GET /api/v1/complaints/nearby`
Performs geospatial proximity matching to detect existing reports near a given coordinate.
- **Auth:** Public
- **Query Parameters:**
  - `lat` (float, required): Latitude
  - `lng` (float, required): Longitude
  - `radiusMeters` (integer, optional, default: 150): Proximity threshold in meters
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "candidates": [
    {
      "id": "a90b4391-4567-4221-a1d2-b677a29e1201",
      "complaint_id": "RC-1024",
      "title": "Severe pothole on main road",
      "category": "pothole",
      "distanceMeters": 42.5,
      "status": "in_progress",
      "created_at": "2026-10-20T08:00:00.000Z"
    }
  ]
}
```

#### `GET /api/v1/complaints`
Role-aware complaint list. Citizens receive only their own reports. Administrators and officers receive all complaints matching filter criteria.
- **Auth:** Bearer Token
- **Query Parameters (Optional):** `status`, `priority`, `category`
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [...]
}
```

#### `POST /api/v1/complaints`
Creates a new civic complaint. Automatically runs proximity duplicate search, evaluates deterministic priority scoring (0–100), inserts complaint into PostgreSQL, and records initial history event.
- **Auth:** Bearer Token (Citizen)
- **Request Body (JSON):**
```json
{
  "title": "Deep pothole near crossroad",
  "description": "Large hole causing vehicles to swerve dangerously during evening traffic.",
  "category": "pothole",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "100 Feet Rd, Indiranagar, Bengaluru",
  "imageUrl": "https://storage.example.com/pothole.jpg",
  "isUrgent": true,
  "trafficDensity": "high"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "a90b4391-4567-4221-a1d2-b677a29e1201",
    "complaint_id": "RC-1025",
    "title": "Deep pothole near crossroad",
    "status": "pending",
    "priority": "critical",
    "created_at": "2026-10-20T10:30:00.000Z"
  },
  "priorityAssessment": {
    "score": 90,
    "tier": "critical",
    "reasons": [
      "Defect Category: pothole (+25 pts)",
      "Citizen marked report as urgent safety hazard (+30 pts)",
      "High traffic density area (+20 pts)"
    ]
  },
  "duplicateCandidates": []
}
```

#### `GET /api/v1/complaints/:id`
Returns full complaint record. Citizens can only view complaints they authored.
- **Auth:** Bearer Token

#### `GET /api/v1/complaints/:id/history`
Retrieves chronological timeline of status transitions, officer assignments, and audit remarks.
- **Auth:** Bearer Token

---

### 4. Admin Management & Analytics

#### `GET /api/v1/admin/dashboard`
Returns aggregated municipal stats, monthly trends, and category breakdowns directly from PostgreSQL.
- **Auth:** Bearer Token (Admin only)
- **Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total": 1284,
    "pending": 342,
    "inProgress": 276,
    "resolved": 666,
    "highPriority": 184,
    "resolutionRatePercent": 52
  },
  "monthlyTrends": [
    { "month": "Jan", "submitted": 80, "resolved": 50 },
    { "month": "Feb", "submitted": 95, "resolved": 62 }
  ],
  "categoryBreakdown": {
    "pothole": 578,
    "road_cracks": 256,
    "damaged_road": 130,
    "drainage": 128,
    "other": 192
  }
}
```

#### `POST /api/v1/admin/assign`
Assigns a field maintenance officer to a complaint and sets status to `in_progress`.
- **Auth:** Bearer Token (Admin only)
- **Request Body:**
```json
{
  "complaintId": "a90b4391-4567-4221-a1d2-b677a29e1201",
  "officerId": "23c1092f-b441-45c1-92e1-458bb319c801",
  "officerName": "Ravi Kumar",
  "expectedCompletionDate": "2026-10-25"
}
```

#### `POST /api/v1/admin/status-transition`
Enforces the municipal state transition machine:
- `pending` → `verified`, `rejected`, `duplicate`
- `verified` → `in_progress`, `rejected`
- `in_progress` → `resolved`, `rejected`
- `resolved` → `closed`, `in_progress` (reopen)
- **Auth:** Bearer Token (Admin only)

---

### 5. Officer Task Workflow

#### `GET /api/v1/officer/tasks`
Returns list of maintenance tasks assigned to the authenticated officer.
- **Auth:** Bearer Token (Officer, Admin)

#### `POST /api/v1/officer/tasks/:id/resolve`
Submits work completion photos, repair remarks, and marks task as `resolved`.
- **Auth:** Bearer Token (Assigned Officer only)
- **Request Body:**
```json
{
  "completionImageUrl": "https://storage.../repaired.jpg",
  "remarks": "Pothole filled with cold mix asphalt and steam rolled. Road surface restored.",
  "status": "resolved"
}
```

---

### 6. AI Computer Vision & Edge Ingestion

#### `GET /api/v1/ai/status`
Checks FastAPI status and reports active model name, version, and supported classes.
- **Auth:** Public

#### `POST /api/v1/ai/analyze-image`
Accepts a multipart file upload (`image`), validates image size (≤5MB) and MIME type, and invokes the Python FastAPI detector. Returns bounding boxes, class labels, and confidence scores.
- **Auth:** Public / Authenticated

#### `POST /api/v1/detection-events`
Ingests road damage detection frames from the browser camera or Python vehicle edge agent.
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "sourceType": "browser_camera",
  "detectedClass": "Pothole",
  "confidence": 94.2,
  "latitude": 12.9716,
  "longitude": 77.5946,
  "boundingBox": { "x": 0.28, "y": 0.44, "width": 0.46, "height": 0.38 }
}
```

---

### 7. In-App Notifications

#### `GET /api/v1/notifications`
Fetches user notifications ordered by `created_at DESC`.
#### `PATCH /api/v1/notifications/:id/read`
Marks single notification as read.
#### `POST /api/v1/notifications/mark-all-read`
Marks all unread notifications for the user as read.
