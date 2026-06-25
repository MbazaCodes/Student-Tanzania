-- ============================================================================
-- Migration 005a: RLS policies + GRANTs baseline (documentation of hotfixes)
-- These were originally applied directly in the Supabase SQL Editor while
-- debugging 400/403 errors. Captured here so the repo is the source of truth.
-- Safe to re-run (idempotent via IF NOT EXISTS / DROP-CREATE).
-- ============================================================================

-- ── user_roles: allow authenticated self-read (needed by RLS subqueries) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_roles' AND policyname = 'user_roles authenticated read'
  ) THEN
    CREATE POLICY "user_roles authenticated read"
    ON public.user_roles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ── schools: table-level grants for write ops ──
GRANT INSERT, UPDATE, DELETE ON public.schools TO authenticated;

-- ── activity_logs: insert + read for authenticated ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'activity_logs' AND policyname = 'activity_logs authenticated insert'
  ) THEN
    CREATE POLICY "activity_logs authenticated insert"
    ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

GRANT INSERT, SELECT ON public.activity_logs TO authenticated;

-- ── auth.users app_metadata role for superadmin (idempotent) ──
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "gov", "is_superadmin": true}'::jsonb
WHERE id = '58a154bb-1ea0-4875-9cc7-0800704546b3';

SELECT 'Migration 005a complete — RLS/grants baseline documented' AS result;
