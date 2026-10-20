-- ============================================================================
-- RoadCare Phase 2 Forward Migration: Extended Schema & Security Hardening
-- Migration: 20261020000000_roadcare_core_schema.sql
-- Non-destructive forward migration extending roles, categories, status history,
-- AI analysis, camera events, and safe public map view.
-- ============================================================================

-- 1. Safely add 'officer' to app_role enum if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'app_role' AND e.enumlabel = 'officer'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'officer';
  END IF;
END$$;

-- 2. Issue Categories & Departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.issue_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  department_name TEXT NOT NULL,
  default_priority TEXT NOT NULL DEFAULT 'medium',
  sla_hours INT NOT NULL DEFAULT 72,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert standard municipal departments
INSERT INTO public.departments (name, contact_email)
VALUES 
  ('Roads & Highways', 'roads@roadcare.local'),
  ('Drainage & Utilities', 'drainage@roadcare.local'),
  ('Electrical & Lighting', 'lighting@roadcare.local'),
  ('Traffic & Signage', 'traffic@roadcare.local'),
  ('Sanitation & Public Works', 'sanitation@roadcare.local')
ON CONFLICT (name) DO NOTHING;

-- Insert standard categories
INSERT INTO public.issue_categories (id, name, department_name, default_priority, sla_hours)
VALUES
  ('pothole', 'Pothole', 'Roads & Highways', 'high', 48),
  ('road_crack', 'Road Cracks (Alligator/Transverse)', 'Roads & Highways', 'medium', 96),
  ('broken_surface', 'Broken / Uneven Road Surface', 'Roads & Highways', 'medium', 72),
  ('manhole_damaged', 'Damaged / Missing Manhole Cover', 'Drainage & Utilities', 'critical', 24),
  ('blocked_drainage', 'Blocked Drainage / Overflow Hazard', 'Drainage & Utilities', 'high', 48),
  ('streetlight_damaged', 'Streetlight Not Working / Damaged', 'Electrical & Lighting', 'medium', 72),
  ('road_sign_damaged', 'Damaged / Missing Road Sign', 'Traffic & Signage', 'medium', 96),
  ('road_marking_faded', 'Faded Road Markings / Zebra Crossing', 'Traffic & Signage', 'low', 120),
  ('broken_footpath', 'Broken Footpath / Sidewalk', 'Roads & Highways', 'low', 120),
  ('water_leakage', 'Water Leakage Affecting Road', 'Drainage & Utilities', 'high', 48),
  ('road_obstruction', 'Garbage / Tree Obstruction', 'Sanitation & Public Works', 'medium', 48),
  ('guardrail_damaged', 'Damaged Barrier / Guardrail', 'Roads & Highways', 'high', 72),
  ('other', 'Other Public Infrastructure Issue', 'Roads & Highways', 'medium', 72)
ON CONFLICT (id) DO NOTHING;

-- 3. Extend complaints table with category, department, assigned_officer, and completion photos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'category') THEN
    ALTER TABLE public.complaints ADD COLUMN category TEXT NOT NULL DEFAULT 'pothole';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'department') THEN
    ALTER TABLE public.complaints ADD COLUMN department TEXT DEFAULT 'Roads & Highways';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'assigned_officer_id') THEN
    ALTER TABLE public.complaints ADD COLUMN assigned_officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'assigned_officer_name') THEN
    ALTER TABLE public.complaints ADD COLUMN assigned_officer_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'completion_image_url') THEN
    ALTER TABLE public.complaints ADD COLUMN completion_image_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'expected_resolution_date') THEN
    ALTER TABLE public.complaints ADD COLUMN expected_resolution_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'resolved_at') THEN
    ALTER TABLE public.complaints ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END$$;

-- 4. Status History & Audit Log table
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view status history" ON public.complaint_status_history
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert status history" ON public.complaint_status_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. AI Analyses table
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  detected_class TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  bounding_box JSONB,
  inference_duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ai_analyses" ON public.ai_analyses FOR SELECT USING (true);
CREATE POLICY "Auth write ai_analyses" ON public.ai_analyses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Detection Events table (Webcam / Dashcam Edge Agent)
CREATE TABLE IF NOT EXISTS public.detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'browser_camera', -- 'browser_camera', 'dashcam_agent', 'upload'
  vehicle_id TEXT,
  camera_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  detected_class TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  bounding_box JSONB,
  snapshot_url TEXT,
  review_state TEXT NOT NULL DEFAULT 'new', -- 'new', 'confirmed', 'dismissed', 'converted_to_complaint'
  linked_complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.detection_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view detection_events" ON public.detection_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write detection_events" ON public.detection_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update detection_events" ON public.detection_events FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit_logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 8. Safe Public Map View (Defense-in-depth: No citizen PII, emails, or phone numbers exposed)
CREATE OR REPLACE VIEW public.public_complaints_view AS
SELECT
  id,
  complaint_id,
  title,
  category,
  department,
  latitude,
  longitude,
  address,
  status,
  priority,
  is_urgent,
  image_url,
  created_at,
  updated_at
FROM public.complaints;
