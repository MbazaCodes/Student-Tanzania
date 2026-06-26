-- ============================================================================
-- Migration 024: fix "new row violates RLS policy for table letter_requests"
-- Hardens identity helpers to also read from the JWT (works even if the
-- admin_users lookup misbehaves in the student/school session), and rebuilds
-- the letter_requests INSERT policy to use them.
-- ============================================================================

-- my_tsid: admin_users.ref → JWT user_metadata.tsid → JWT app_metadata.tsid
CREATE OR REPLACE FUNCTION public.my_tsid()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ref FROM public.admin_users
      WHERE auth_uid = auth.uid() AND role = 'student' LIMIT 1),
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'tsid', ''),
    NULLIF(auth.jwt() -> 'app_metadata'  ->> 'tsid', '')
  );
$$;

-- my_school_code: admin_users.ref → JWT user_metadata.school_code → app_metadata.school_code
CREATE OR REPLACE FUNCTION public.my_school_code()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ref FROM public.admin_users
      WHERE auth_uid = auth.uid() AND role = 'school' LIMIT 1),
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'school_code', ''),
    NULLIF(auth.jwt() -> 'app_metadata'  ->> 'school_code', '')
  );
$$;

-- Rebuild the INSERT policy. Allow:
--  * a student inserting a row whose tsid is THEIR tsid
--  * a school inserting a row whose school_code is THEIR school
--  * any gov admin (national/region/district)
DROP POLICY IF EXISTS "lr insert" ON public.letter_requests;
CREATE POLICY "lr insert" ON public.letter_requests FOR INSERT TO authenticated
WITH CHECK (
  (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 024 complete — letter_requests insert fixed' AS result;
