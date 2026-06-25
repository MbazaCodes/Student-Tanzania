-- ============================================================================
-- Migration 012: Fix RLS recursion on admin_users
-- The previous policies queried admin_users inside admin_users policies,
-- causing infinite recursion → empty results everywhere.
-- Fix: use ONLY SECURITY DEFINER helper functions (they bypass RLS).
-- ============================================================================

-- Add helper for caller's own role (SECURITY DEFINER = no recursion)
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.admin_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;

-- ── admin_users: drop recursive policies, recreate using helpers only ──
DROP POLICY IF EXISTS "admins read scope" ON public.admin_users;
CREATE POLICY "admins read scope"
ON public.admin_users FOR SELECT TO authenticated
USING (
  auth_uid = auth.uid()                              -- always see self
  OR public.is_national()                            -- national sees all
  OR (public.my_role() = 'gov_region' AND region = public.my_region())
);

DROP POLICY IF EXISTS "admins insert scope" ON public.admin_users;
CREATE POLICY "admins insert scope"
ON public.admin_users FOR INSERT TO authenticated
WITH CHECK (
  public.is_national()
  OR (public.my_role() = 'gov_region' AND role = 'gov_district' AND region = public.my_region())
);

-- ── schools: rewrite using helpers only (no inline admin_users subquery) ──
DROP POLICY IF EXISTS "schools scope read" ON public.schools;
DROP POLICY IF EXISTS "schools authenticated read" ON public.schools;
DROP POLICY IF EXISTS "schools anon read" ON public.schools;
CREATE POLICY "schools read all authenticated"
ON public.schools FOR SELECT TO authenticated
USING (true);   -- all signed-in users can read schools; scope filtering done in UI
CREATE POLICY "schools read anon"
ON public.schools FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "schools scope insert" ON public.schools;
DROP POLICY IF EXISTS "schools gov full access" ON public.schools;
CREATE POLICY "schools insert scope"
ON public.schools FOR INSERT TO authenticated
WITH CHECK (
  public.is_national()
  OR (public.my_region() IS NOT NULL AND region = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

DROP POLICY IF EXISTS "schools scope update" ON public.schools;
CREATE POLICY "schools update scope"
ON public.schools FOR UPDATE TO authenticated
USING (
  public.is_national()
  OR (public.my_region() IS NOT NULL AND region = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

-- ── students: ensure readable by authenticated gov/school ──
DROP POLICY IF EXISTS "students read all authenticated" ON public.students;
CREATE POLICY "students read all authenticated"
ON public.students FOR SELECT TO authenticated
USING (true);

-- ── activity_logs already have policies; ensure read works ──
DROP POLICY IF EXISTS "activity_logs gov read" ON public.activity_logs;
CREATE POLICY "activity_logs gov read"
ON public.activity_logs FOR SELECT TO authenticated
USING (true);

SELECT 'Migration 012 complete — RLS recursion fixed' AS result;
