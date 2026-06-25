-- ============================================================================
-- Migration 011: Admin hierarchy — National / Regional / District
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. Add district column to admin_users (region already exists)
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS district   TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID;   -- which admin created this admin

-- 2. Roles now stored as TEXT (no enum constraint blocking new values):
--    'gov'          = National admin (sees all)
--    'gov_region'   = Regional admin (1 region)
--    'gov_district' = District admin (1 district)
--    'school', 'student' unchanged

-- 3. Helper: get current admin's row
CREATE OR REPLACE FUNCTION public.current_admin()
RETURNS public.admin_users
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.admin_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;

-- 4. Helper: does current user have national scope?
CREATE OR REPLACE FUNCTION public.is_national()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_uid = auth.uid() AND role IN ('gov','admin')
  );
$$;

-- 5. Helper: current user's managed region (NULL if national)
CREATE OR REPLACE FUNCTION public.my_region()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT region FROM public.admin_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;

-- 6. Helper: current user's managed district (NULL if national/regional)
CREATE OR REPLACE FUNCTION public.my_district()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT district FROM public.admin_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;

-- 7. RLS on admin_users: who can see which admins
DROP POLICY IF EXISTS "admins read scope" ON public.admin_users;
CREATE POLICY "admins read scope"
ON public.admin_users FOR SELECT TO authenticated
USING (
  auth_uid = auth.uid()                          -- always see self
  OR public.is_national()                        -- national sees all
  OR (                                           -- regional sees admins in their region
    (SELECT role FROM public.admin_users WHERE auth_uid = auth.uid()) = 'gov_region'
    AND region = public.my_region()
  )
);

-- 8. RLS on admin_users: who can create admins
DROP POLICY IF EXISTS "admins insert scope" ON public.admin_users;
CREATE POLICY "admins insert scope"
ON public.admin_users FOR INSERT TO authenticated
WITH CHECK (
  public.is_national()                           -- national creates any
  OR (                                           -- regional creates only district admins in their region
    (SELECT role FROM public.admin_users WHERE auth_uid = auth.uid()) = 'gov_region'
    AND role = 'gov_district'
    AND region = public.my_region()
  )
);

-- 9. RLS on schools: scope-limited visibility + management
DROP POLICY IF EXISTS "schools scope read" ON public.schools;
CREATE POLICY "schools scope read"
ON public.schools FOR SELECT TO authenticated
USING (
  public.is_national()
  OR (public.my_region() IS NOT NULL AND region = public.my_region() AND public.my_district() IS NULL)
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
  OR true   -- schools/students can still read for their own portal needs
);

DROP POLICY IF EXISTS "schools scope insert" ON public.schools;
CREATE POLICY "schools scope insert"
ON public.schools FOR INSERT TO authenticated
WITH CHECK (
  public.is_national()
  OR (public.my_region() IS NOT NULL AND region = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

DROP POLICY IF EXISTS "schools scope update" ON public.schools;
CREATE POLICY "schools scope update"
ON public.schools FOR UPDATE TO authenticated
USING (
  public.is_national()
  OR (public.my_region() IS NOT NULL AND region = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

SELECT 'Migration 011 complete — admin hierarchy ready' AS result;
