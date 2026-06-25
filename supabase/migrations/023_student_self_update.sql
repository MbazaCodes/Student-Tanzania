-- Migration 023: allow a student to update their OWN record
-- Needed so students can save their own profile photo directly.

-- Helper that reads tsid from BOTH admin_users AND the JWT metadata,
-- so it works even if the admin_users row is missing but the JWT has it.
CREATE OR REPLACE FUNCTION public.my_tsid()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ref FROM public.admin_users
      WHERE auth_uid = auth.uid() AND role = 'student' LIMIT 1),
    (auth.jwt() -> 'user_metadata' ->> 'tsid'),
    (auth.jwt() -> 'app_metadata' ->> 'tsid')
  );
$$;

DROP POLICY IF EXISTS "students self update" ON public.students;
CREATE POLICY "students self update"
ON public.students FOR UPDATE TO authenticated
USING (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
WITH CHECK (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid());

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 023 complete — students can update own record' AS result;
