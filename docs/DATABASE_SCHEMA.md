# RoadCare — Database Schema

RoadCare uses PostgreSQL via Supabase with Row Level Security (RLS) enabled on all tables.

## 1. Tables & Enums

### Enums
- `app_role`: `'admin'`, `'citizen'`, `'officer'`
- `complaint_status`: `'pending'`, `'awaiting_verification'`, `'verified'`, `'in_progress'`, `'resolved'`, `'citizen_confirmed'`, `'closed'`, `'rejected'`, `'duplicate'`
- `complaint_priority`: `'low'`, `'medium'`, `'high'`, `'critical'`

### `user_roles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, gen_random_uuid() | Record ID |
| `user_id` | UUID | REFERENCES auth.users(id) ON DELETE CASCADE | User reference |
| `role` | app_role | NOT NULL DEFAULT 'citizen' | Role assigned to user |

### `profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, gen_random_uuid() | Profile ID |
| `user_id` | UUID | REFERENCES auth.users(id) ON DELETE CASCADE, UNIQUE | Supabase auth user reference |
| `full_name` | TEXT | | Citizen/Staff name |
| `email` | TEXT | | Registered email |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Updated timestamp |

### `complaints`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, gen_random_uuid() | UUID key |
| `complaint_id` | TEXT | NOT NULL UNIQUE | Human-readable ID (e.g. `RC-1024`) |
| `user_id` | UUID | REFERENCES auth.users(id) ON DELETE CASCADE | Reporter ID |
| `title` | TEXT | NOT NULL | Brief summary |
| `description` | TEXT | NOT NULL | Detailed description |
| `category` | TEXT | NOT NULL DEFAULT 'pothole' | Defect category ID |
| `department` | TEXT | | Assigned municipal department |
| `assigned_officer_id` | UUID | REFERENCES auth.users(id) ON DELETE SET NULL | Assigned officer ID |
| `assigned_officer_name` | TEXT | | Assigned officer display name |
| `image_url` | TEXT | | Reporter photo evidence |
| `completion_image_url` | TEXT | | Officer resolution photo |
| `latitude` | DOUBLE PRECISION | NOT NULL | GPS latitude |
| `longitude` | DOUBLE PRECISION | NOT NULL | GPS longitude |
| `address` | TEXT | | Reverse-geocoded place name |
| `status` | complaint_status | NOT NULL DEFAULT 'pending' | Current lifecycle status |
| `priority` | complaint_priority | NOT NULL DEFAULT 'medium' | Calculated or assigned priority |
| `is_urgent` | BOOLEAN | NOT NULL DEFAULT false | Urgent safety hazard flag |
| `admin_remark` | TEXT | | Field notes and resolution remarks |
| `expected_resolution_date` | TIMESTAMPTZ | | SLA deadline |
| `resolved_at` | TIMESTAMPTZ | | Resolution timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Updated timestamp |

### `complaint_status_history`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, gen_random_uuid() | Event ID |
| `complaint_id` | UUID | REFERENCES complaints(id) ON DELETE CASCADE | Complaint reference |
| `old_status` | TEXT | | Previous status |
| `new_status` | TEXT | NOT NULL | New status |
| `changed_by` | UUID | REFERENCES auth.users(id) | Actor user ID |
| `actor_name` | TEXT | | Display name of actor |
| `remark` | TEXT | | Reason or audit remark |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Transition timestamp |

### `detection_events`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, gen_random_uuid() | Event ID |
| `event_code` | TEXT | NOT NULL UNIQUE | Human code (e.g. `EV-123456`) |
| `source_type` | TEXT | NOT NULL | `browser_camera`, `dashcam_agent`, `upload` |
| `vehicle_id` | TEXT | | Patrol vehicle ID |
| `camera_id` | TEXT | | Device identifier |
| `latitude` | DOUBLE PRECISION | | Geotagged latitude |
| `longitude` | DOUBLE PRECISION | | Geotagged longitude |
| `detected_class` | TEXT | NOT NULL | Identified defect |
| `confidence` | DOUBLE PRECISION | NOT NULL | Model confidence % |
| `bounding_box` | JSONB | | Normalized box coordinates |
| `snapshot_url` | TEXT | | Frame thumbnail |
| `review_state` | TEXT | NOT NULL DEFAULT 'new' | `new`, `confirmed`, `dismissed`, `converted` |

### `notifications`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, gen_random_uuid() | Notification ID |
| `user_id` | UUID | NOT NULL | Recipient user ID |
| `complaint_id` | UUID | REFERENCES complaints(id) ON DELETE CASCADE | Associated issue |
| `message` | TEXT | NOT NULL | Alert text |
| `is_read` | BOOLEAN | NOT NULL DEFAULT false | Read indicator |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Timestamp |

---

## 2. Views

### `public_complaints_view`
Projects only safe public map fields:
- `id`, `complaint_id`, `title`, `category`, `department`, `latitude`, `longitude`, `address`, `status`, `priority`, `is_urgent`, `image_url`, `created_at`.
- Strips `user_id`, reporter emails, phone numbers, and private notes.
