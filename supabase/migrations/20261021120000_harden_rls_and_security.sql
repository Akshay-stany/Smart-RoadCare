-- ============================================================================
-- Migration: 20261021120000_harden_rls_and_security.sql
-- Comprehensive Security Hardening & Row Level Security (RLS) Enforcement
-- Addresses Project Audit Findings: S1 (complaint mutation tampering),
-- S2 (profile PII exposure), S5 (storage isolation), and S7 (ID collisions).
-- ============================================================================

BEGIN;

-- 1. HARDEN COMPLAINTS RLS POLICIES
-- Drop unsafe policy allowing citizens to arbitrarily modify complaint records, status, or remarks
DROP POLICY IF EXISTS "Users can update own complaints" ON public.complaints;

-- Re-affirm or recreate Admin update policy
DROP POLICY IF EXISTS "Admins can update any complaint" ON public.complaints;
CREATE POLICY "Admins can update any complaint" ON public.complaints
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow Officers to update assigned complaints only
DROP POLICY IF EXISTS "Officers can update assigned complaints" ON public.complaints;
CREATE POLICY "Officers can update assigned complaints" ON public.complaints
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'officer') AND assigned_officer_id = auth.uid());

-- Hardened complaint INSERT policy: citizens can only submit for their own user_id,
-- starting in 'pending' status without injecting administrative remarks
DROP POLICY IF EXISTS "Authenticated users can create complaints" ON public.complaints;
CREATE POLICY "Authenticated users can create complaints" ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND admin_remark IS NULL
  );

-- 2. HARDEN PROFILES RLS POLICIES
-- Drop public read policy that leaked citizen names and email addresses to the public
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Officers can view all profiles" ON public.profiles;
CREATE POLICY "Officers can view all profiles" ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'officer'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. HARDEN STORAGE SECURITY (BUCKET: complaint-images)
-- Disallow arbitrary overwrites or writing to arbitrary paths; isolate uploads by user folder
DROP POLICY IF EXISTS "Authenticated users can upload complaint images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;

CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'complaint-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enforce 5 MB maximum file size and restrict to image MIME types
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'complaint-images';

-- 4. HARDEN COMPLAINT ID GENERATION (PREVENT BIRTHDAY PARADOX COLLISIONS)
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
  LOOP
    candidate := 'RC-' || LPAD(FLOOR(RANDOM() * 1000000)::BIGINT::TEXT, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.complaints WHERE complaint_id = candidate);
    attempts := attempts + 1;
    IF attempts >= 25 THEN
      RAISE EXCEPTION 'Could not allocate a unique complaint id after % attempts', attempts;
    END IF;
  END LOOP;
  NEW.complaint_id := candidate;
  RETURN NEW;
END;
$$;

-- 5. ENSURE NOTIFICATIONS RLS IS STRICT
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

COMMIT;
