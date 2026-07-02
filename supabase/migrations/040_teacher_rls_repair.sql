-- ============================================================================
-- Migration 040: TEACHER RLS REPAIR (consolidated, deterministic)
-- Rebuilds the entire teacher access stack in one pass. Safe to re-run.
-- Also adds debug_teacher_access() so access can be verified from a real
-- teacher session (auth.uid() is NULL in the SQL editor, so editor tests of
-- these functions always return false/null — not a real signal).
-- ============================================================================

-- 1) Helpers ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.uid()
RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT auth.uid() $$;

CREATE OR REPLACE FUNCTION public.my_teacher_ref()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ref FROM public.admin_users WHERE auth_uid = auth.uid() AND role = 'teacher' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_teacher_school()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_code FROM public.teacher_assignments
  WHERE teacher_ref = public.my_teacher_ref() LIMIT 1;
$$;

-- Canonical access check: is the CURRENT authenticated user a teacher with an
-- assignment covering this student's school+level? Self-contained, RLS-bypassing.
CREATE OR REPLACE FUNCTION public.teacher_can_access(p_tsid TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_assignments ta
      ON lower(trim(ta.school_code)) = lower(trim(s.school_code))
     AND lower(trim(ta.level))       = lower(trim(s.level))
    JOIN public.admin_users au
      ON au.ref = ta.teacher_ref AND au.role = 'teacher'
    WHERE s.tsid = p_tsid
      AND au.auth_uid = auth.uid()
  );
$$;

-- Debug: run from a REAL teacher session (app), returns full ground truth.
CREATE OR REPLACE FUNCTION public.debug_teacher_access(p_tsid TEXT)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'auth_uid',        auth.uid(),
    'admin_row',       (SELECT jsonb_build_object('ref', ref, 'role', role)
                          FROM public.admin_users WHERE auth_uid = auth.uid() LIMIT 1),
    'assignments',     (SELECT jsonb_agg(jsonb_build_object('school', school_code, 'level', level))
                          FROM public.teacher_assignments ta
                          JOIN public.admin_users au ON au.ref = ta.teacher_ref
                         WHERE au.auth_uid = auth.uid()),
    'student',         (SELECT jsonb_build_object('tsid', tsid, 'school', school_code, 'level', level)
                          FROM public.students WHERE tsid = p_tsid),
    'can_access',      public.teacher_can_access(p_tsid)
  );
$$;

GRANT EXECUTE ON FUNCTION public.uid()                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_teacher_ref()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_teacher_school()         TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_can_access(TEXT)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_teacher_access(TEXT)  TO authenticated;

-- 2) Rebuild ALL teacher policies canonically ---------------------------
-- (Every one uses the single SECURITY DEFINER check — no inline joins that
--  depend on the caller's RLS on admin_users/teacher_assignments.)

DROP POLICY IF EXISTS "students teacher read" ON public.students;
CREATE POLICY "students teacher read" ON public.students FOR SELECT TO authenticated
USING (public.teacher_can_access(tsid));

DROP POLICY IF EXISTS "dev teacher read" ON public.student_development;
CREATE POLICY "dev teacher read" ON public.student_development FOR SELECT TO authenticated
USING (public.teacher_can_access(tsid));

DROP POLICY IF EXISTS "dev teacher insert" ON public.student_development;
CREATE POLICY "dev teacher insert" ON public.student_development FOR INSERT TO authenticated
WITH CHECK (public.teacher_can_access(tsid));

DROP POLICY IF EXISTS "dev teacher update" ON public.student_development;
CREATE POLICY "dev teacher update" ON public.student_development FOR UPDATE TO authenticated
USING (public.teacher_can_access(tsid))
WITH CHECK (public.teacher_can_access(tsid));

DROP POLICY IF EXISTS "dev teacher delete" ON public.student_development;
CREATE POLICY "dev teacher delete" ON public.student_development FOR DELETE TO authenticated
USING (public.teacher_can_access(tsid));

DROP POLICY IF EXISTS "fa teacher read" ON public.field_attachments;
CREATE POLICY "fa teacher read" ON public.field_attachments FOR SELECT TO authenticated
USING (public.teacher_can_access(tsid));
DROP POLICY IF EXISTS "fa teacher write" ON public.field_attachments;
CREATE POLICY "fa teacher write" ON public.field_attachments FOR INSERT TO authenticated
WITH CHECK (public.teacher_can_access(tsid));
DROP POLICY IF EXISTS "fa teacher update" ON public.field_attachments;
CREATE POLICY "fa teacher update" ON public.field_attachments FOR UPDATE TO authenticated
USING (public.teacher_can_access(tsid));

DROP POLICY IF EXISTS "devaudit teacher insert" ON public.development_audit;
CREATE POLICY "devaudit teacher insert" ON public.development_audit FOR INSERT TO authenticated
WITH CHECK (public.teacher_can_access(tsid));
DROP POLICY IF EXISTS "devaudit teacher read" ON public.development_audit;
CREATE POLICY "devaudit teacher read" ON public.development_audit FOR SELECT TO authenticated
USING (public.teacher_can_access(tsid));

-- 3) teacher_assignments policies (unchanged, recreated for determinism) --
DROP POLICY IF EXISTS "ta read" ON public.teacher_assignments;
CREATE POLICY "ta read" ON public.teacher_assignments FOR SELECT TO authenticated
USING (
  (public.my_teacher_ref() IS NOT NULL AND teacher_ref = public.my_teacher_ref())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);
DROP POLICY IF EXISTS "ta write" ON public.teacher_assignments;
CREATE POLICY "ta write" ON public.teacher_assignments FOR INSERT TO authenticated
WITH CHECK ((public.my_school_code() IS NOT NULL AND school_code = public.my_school_code()) OR public.is_national());
DROP POLICY IF EXISTS "ta delete" ON public.teacher_assignments;
CREATE POLICY "ta delete" ON public.teacher_assignments FOR DELETE TO authenticated
USING ((public.my_school_code() IS NOT NULL AND school_code = public.my_school_code()) OR public.is_national());

GRANT SELECT, INSERT, DELETE ON public.teacher_assignments TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 040 complete — teacher RLS rebuilt' AS result;
