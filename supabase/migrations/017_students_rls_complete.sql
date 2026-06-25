-- ============================================================================
-- Migration 017: Complete students RLS — school can insert/manage own students,
-- gov tiers can read/manage by scope, students can read own record.
-- Fixes "new row violates row-level security policy for table students"
-- ============================================================================

-- Helper: caller's school_code (for school accounts; ref stores school_code)
CREATE OR REPLACE FUNCTION public.my_school_code()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ref FROM public.admin_users
  WHERE auth_uid = auth.uid() AND role = 'school' LIMIT 1;
$$;

-- Helper: caller's tsid (for student accounts)
CREATE OR REPLACE FUNCTION public.my_tsid()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ref FROM public.admin_users
  WHERE auth_uid = auth.uid() AND role = 'student' LIMIT 1;
$$;

-- ── READ: gov (scoped) + school (own) + student (own) ──
DROP POLICY IF EXISTS "students read all authenticated" ON public.students;
DROP POLICY IF EXISTS "students read scope" ON public.students;
CREATE POLICY "students read scope"
ON public.students FOR SELECT TO authenticated
USING (
  public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
);

-- Public/anon can read for the verification page (limited columns in UI)
DROP POLICY IF EXISTS "students read anon" ON public.students;
CREATE POLICY "students read anon"
ON public.students FOR SELECT TO anon USING (true);

-- ── INSERT: school inserts students for its own school_code; gov by scope ──
DROP POLICY IF EXISTS "students insert scope" ON public.students;
CREATE POLICY "students insert scope"
ON public.students FOR INSERT TO authenticated
WITH CHECK (
  public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
);

-- ── UPDATE: same scope as insert ──
DROP POLICY IF EXISTS "students update scope" ON public.students;
CREATE POLICY "students update scope"
ON public.students FOR UPDATE TO authenticated
USING (
  public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
);

-- ── DELETE: national only ──
DROP POLICY IF EXISTS "students delete national" ON public.students;
CREATE POLICY "students delete national"
ON public.students FOR DELETE TO authenticated
USING (public.is_national());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT ON public.students TO anon;

-- ── applications: school can read/write own; students read own ──
DROP POLICY IF EXISTS "applications scope" ON public.applications;
CREATE POLICY "applications scope"
ON public.applications FOR ALL TO authenticated
USING (
  public.is_national()
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
)
WITH CHECK (
  public.is_national()
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;

NOTIFY pgrst, 'reload schema';

SELECT 'Migration 017 complete — students/applications RLS ready' AS result;
