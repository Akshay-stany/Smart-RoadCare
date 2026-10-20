-- ============================================================================
-- PROPOSED MIGRATION — NOT APPLIED, NOT in supabase/migrations/ ON PURPOSE.
--
-- Addresses PROJECT_AUDIT findings S1, S2, S5, S7.
-- This file was written from reading the repo's migrations only. The sandbox that
-- produced it could not reach the hosted Supabase project, so it has NOT been run
-- against any database.
--
-- Before applying:
--   1. Back up (Dashboard -> Database -> Backups, or `pg_dump`).
--   2. Compare deployed policies with the repo:
--        select schemaname, tablename, policyname, cmd, qual, with_check
--        from pg_policies where schemaname in ('public','storage') order by 1,2,3;
--      If they differ from supabase/migrations/*, STOP and adjust this file.
--   3. Apply to a STAGING project first and click through: sign up, report an issue,
--      upload an image, admin status change, notification bell.
--   4. Only then copy into supabase/migrations/ with a timestamped name.
--
-- Expected behaviour changes:
--   * Citizens can no longer UPDATE their own complaints (the current UI has no such feature).
--   * profiles (name/email) readable only by the owner and admins. The admin
--     "Reports by Users" dialog keeps working; citizens never see other users' emails.
--   * Image uploads must go under "<auth.uid()>/..." (the current client already does).
--   * Bucket limited to 5 MB and jpeg/png/webp.
--   * New complaint ids are checked for uniqueness before use.
--
-- NOT changed here (needs the Phase 5/7 API + a public view): complaints remain
-- world-readable (S3) because the public map and tracking depend on it.
-- ============================================================================

BEGIN;

-- S1: owners must not be able to edit status / priority / admin_remark on their own rows.
DROP POLICY IF EXISTS "Users can update own complaints" ON public.complaints;
-- "Admins can update any complaint" remains the only UPDATE policy.

-- S2: stop publishing every user's name and email.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- S5: uploads only into the uploader's own folder; bucket-level size and type limits.
DROP POLICY IF EXISTS "Authenticated users can upload complaint images" ON storage.objects;
CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'complaint-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'complaint-images';

-- S7: avoid random-id collisions (birthday bound ~39% at 1,000 rows with a bare RANDOM()).
-- Keeps the existing RC-###### format so old ids stay valid. The UNIQUE constraint remains
-- the final guard against a concurrent race.
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

COMMIT;

-- Rollback sketch (run manually if needed):
--   CREATE POLICY "Users can update own complaints" ON public.complaints FOR UPDATE USING (auth.uid() = user_id);
--   DROP POLICY "Users can view own profile" ON public.profiles;
--   DROP POLICY "Admins can view all profiles" ON public.profiles;
--   CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
--   DROP POLICY "Users upload to own folder" ON storage.objects;
--   CREATE POLICY "Authenticated users can upload complaint images" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'complaint-images' AND auth.role() = 'authenticated');
