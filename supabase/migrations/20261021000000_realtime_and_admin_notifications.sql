-- ============================================================================
-- RoadCare Phase 3 Forward Migration: Realtime Publication & Admin Notifications
-- Migration: 20261021000000_realtime_and_admin_notifications.sql
-- Adds complaints & profiles to supabase_realtime publication, triggers admin
-- alerts on new complaint submissions, and citizen alerts on status updates.
-- ============================================================================

-- 1. Safely add tables to supabase_realtime publication
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

-- 2. Trigger Function: Notify All Admins when a new complaint is submitted
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
      'New complaint #' || NEW.complaint_id || ': "' || NEW.title || '" at ' || COALESCE(NEW.address, 'Reported location') || ' submitted at ' || to_char(now(), 'HH12:MI AM'),
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

-- 3. Trigger Function: Notify Citizen when their complaint status updates
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
      'Complaint #' || NEW.complaint_id || ': "' || NEW.title || '" status changed to ' || UPPER(REPLACE(NEW.status::TEXT, '_', ' ')) || ' at ' || to_char(now(), 'HH12:MI AM') || COALESCE(' — ' || NEW.admin_remark, ''),
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

-- 4. Ensure RLS on public.notifications permits authenticated inserts & reads
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can view all notifications'
  ) THEN
    CREATE POLICY "Admins can view all notifications"
      ON public.notifications FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;
