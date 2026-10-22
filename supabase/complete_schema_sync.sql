-- ============================================================================
-- RoadCare Complete Schema Sync Migration
-- Project: rzqflrowokffigwzahzf (Smart-RoadCare)
-- Fully idempotently brings the Supabase database to 100% production readiness.
-- ============================================================================

-- 1. App Roles Enum & Officer role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'citizen', 'officer');
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = 'app_role' AND e.enumlabel = 'officer'
    ) THEN
      ALTER TYPE public.app_role ADD VALUE 'officer';
    END IF;
  END IF;
END$$;

-- 2. User Roles Table & has_role function
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 3. Profiles Table Hardening
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure user_id column exists and is UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
    ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_number') THEN
    ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- Backfill user_id if id was previously matching auth.users
  UPDATE public.profiles SET user_id = id WHERE user_id IS NULL AND id IN (SELECT id FROM auth.users);

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key') THEN
    BEGIN
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Officers can view all profiles" ON public.profiles;
CREATE POLICY "Officers can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'officer'));
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- 4. Departments & Issue Categories
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

INSERT INTO public.departments (name, contact_email)
VALUES 
  ('Roads & Highways', 'roads@roadcare.local'),
  ('Drainage & Utilities', 'drainage@roadcare.local'),
  ('Electrical & Lighting', 'lighting@roadcare.local'),
  ('Traffic & Signage', 'traffic@roadcare.local'),
  ('Sanitation & Public Works', 'sanitation@roadcare.local')
ON CONFLICT (name) DO NOTHING;

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

-- 5. Complaints Table Migration & Column Expansion
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'pothole',
  department TEXT DEFAULT 'Roads & Highways',
  image_url TEXT,
  completion_image_url TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  admin_remark TEXT,
  assigned_officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_officer_name TEXT,
  expected_resolution_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'complaint_id') THEN
    ALTER TABLE public.complaints ADD COLUMN complaint_id TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'category') THEN
    ALTER TABLE public.complaints ADD COLUMN category TEXT NOT NULL DEFAULT 'pothole';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'department') THEN
    ALTER TABLE public.complaints ADD COLUMN department TEXT DEFAULT 'Roads & Highways';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'priority') THEN
    ALTER TABLE public.complaints ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'address') THEN
    ALTER TABLE public.complaints ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'is_urgent') THEN
    ALTER TABLE public.complaints ADD COLUMN is_urgent BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'admin_remark') THEN
    ALTER TABLE public.complaints ADD COLUMN admin_remark TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'assigned_officer_id') THEN
    ALTER TABLE public.complaints ADD COLUMN assigned_officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'assigned_officer_name') THEN
    ALTER TABLE public.complaints ADD COLUMN assigned_officer_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'completion_image_url') THEN
    ALTER TABLE public.complaints ADD COLUMN completion_image_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'expected_resolution_date') THEN
    ALTER TABLE public.complaints ADD COLUMN expected_resolution_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'resolved_at') THEN
    ALTER TABLE public.complaints ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'updated_at') THEN
    ALTER TABLE public.complaints ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END$$;

-- Auto-generate complaint ID function and trigger
CREATE OR REPLACE FUNCTION public.generate_complaint_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  attempts  INT := 0;
BEGIN
  IF NEW.complaint_id IS NULL OR NEW.complaint_id = '' THEN
    LOOP
      candidate := 'RC-' || LPAD(FLOOR(RANDOM() * 1000000)::BIGINT::TEXT, 6, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.complaints WHERE complaint_id = candidate);
      attempts := attempts + 1;
      IF attempts >= 25 THEN
        RAISE EXCEPTION 'Could not allocate a unique complaint id after % attempts', attempts;
      END IF;
    END LOOP;
    NEW.complaint_id := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_complaint_id ON public.complaints;
CREATE TRIGGER set_complaint_id
  BEFORE INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_complaint_id();

-- Complaints RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view complaints" ON public.complaints;
CREATE POLICY "Anyone can view complaints" ON public.complaints FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create complaints" ON public.complaints;
CREATE POLICY "Authenticated users can create complaints" ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND admin_remark IS NULL
  );

DROP POLICY IF EXISTS "Users can update own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update any complaint" ON public.complaints;
CREATE POLICY "Admins can update any complaint" ON public.complaints
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Officers can update assigned complaints" ON public.complaints;
CREATE POLICY "Officers can update assigned complaints" ON public.complaints
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'officer') AND assigned_officer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete complaints" ON public.complaints;
CREATE POLICY "Admins can delete complaints" ON public.complaints FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'complaint_id') THEN
    ALTER TABLE public.notifications ADD COLUMN complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read') THEN
    ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;
  END IF;
END$$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Complaint Status History
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
DROP POLICY IF EXISTS "Anyone can view status history" ON public.complaint_status_history;
CREATE POLICY "Anyone can view status history" ON public.complaint_status_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert status history" ON public.complaint_status_history;
CREATE POLICY "Authenticated users can insert status history" ON public.complaint_status_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. AI Analyses Table
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
DROP POLICY IF EXISTS "Public read ai_analyses" ON public.ai_analyses;
CREATE POLICY "Public read ai_analyses" ON public.ai_analyses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth write ai_analyses" ON public.ai_analyses;
CREATE POLICY "Auth write ai_analyses" ON public.ai_analyses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 9. Detection Events Table (Webcam / Dashcam Edge Agent)
CREATE TABLE IF NOT EXISTS public.detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'browser_camera',
  vehicle_id TEXT,
  camera_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  detected_class TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  bounding_box JSONB,
  snapshot_url TEXT,
  review_state TEXT NOT NULL DEFAULT 'new',
  linked_complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.detection_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth view detection_events" ON public.detection_events;
CREATE POLICY "Auth view detection_events" ON public.detection_events FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Auth write detection_events" ON public.detection_events;
CREATE POLICY "Auth write detection_events" ON public.detection_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update detection_events" ON public.detection_events;
CREATE POLICY "Admin update detection_events" ON public.detection_events FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 10. Audit Logs Table
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
DROP POLICY IF EXISTS "Admins view audit_logs" ON public.audit_logs;
CREATE POLICY "Admins view audit_logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Auth write audit_logs" ON public.audit_logs;
CREATE POLICY "Auth write audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 11. Safe Public Map View
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

-- 12. User Creation Trigger (Auto-provision profile & role on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Admin & Citizen Notification Triggers
CREATE OR REPLACE FUNCTION public.notify_admins_new_complaint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, complaint_id, message, is_read, created_at)
    VALUES (
      admin_record.user_id,
      NEW.id,
      'New complaint #' || COALESCE(NEW.complaint_id, NEW.id::text) || ': "' || NEW.title || '" at ' || COALESCE(NEW.address, 'Reported location') || ' submitted at ' || to_char(now(), 'HH12:MI AM'),
      false,
      now()
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_complaint_inserted_notify_admins ON public.complaints;
CREATE TRIGGER on_complaint_inserted_notify_admins
  AFTER INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_complaint();

CREATE OR REPLACE FUNCTION public.notify_citizen_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, complaint_id, message, is_read, created_at)
    VALUES (
      NEW.user_id,
      NEW.id,
      'Complaint #' || COALESCE(NEW.complaint_id, NEW.id::text) || ': "' || NEW.title || '" status changed to ' || UPPER(REPLACE(NEW.status::TEXT, '_', ' ')) || ' at ' || to_char(now(), 'HH12:MI AM') || COALESCE(' — ' || NEW.admin_remark, ''),
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_complaint_status_change ON public.complaints;
CREATE TRIGGER on_complaint_status_change
  AFTER UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_citizen_status_change();

-- 14. Realtime publication registration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;
