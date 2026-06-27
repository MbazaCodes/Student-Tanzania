-- ============================================================================
-- Migration 038: Teacher / Educator role
-- A teacher belongs to a school and is granted access to specific classes
-- (e.g. Standard 4). They can monitor & manage development for students in
-- their assigned class(es). School grants/revokes the assignment.
-- ============================================================================

-- Teacher ↔ class assignments (school grants access by level/class).
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_ref  TEXT NOT NULL,       -- teacher's ref (email handle)
  teacher_uid  UUID,
  school_code  TEXT NOT NULL,
  level        TEXT NOT NULL,       -- assigned class e.g. 'Standard 4'
  role_title   TEXT,                -- 'Class Teacher' | 'Instructor' | 'Dean' ...
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_ref, school_code, level)
);
CREATE INDEX IF NOT EXISTS idx_ta_teacher ON public.teacher_assignments(teacher_ref);
CREATE INDEX IF NOT EXISTS idx_ta_school  ON public.teacher_assignments(school_code);

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.my_teacher_ref()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ref FROM public.admin_users WHERE auth_uid = auth.uid() AND role = 'teacher' LIMIT 1;
$$;

-- The school_code the teacher belongs to
CREATE OR REPLACE FUNCTION public.my_teacher_school()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_code FROM public.teacher_assignments
  WHERE teacher_ref = public.my_teacher_ref() LIMIT 1;
$$;

-- Can the teacher access this student? (same school AND assigned to their level)
CREATE OR REPLACE FUNCTION public.teacher_can_access(p_tsid TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_assignments ta
      ON ta.teacher_ref = public.my_teacher_ref()
     AND ta.school_code = s.school_code
     AND ta.level = s.level
    WHERE s.tsid = p_tsid
  );
$$;

GRANT EXECUTE ON FUNCTION public.my_teacher_ref() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_teacher_school() TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_can_access(TEXT) TO authenticated;

-- teacher_assignments RLS: teacher reads own; school/gov manage their scope
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

-- Teacher READ + WRITE on their assigned students' development & related data
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
USING (public.teacher_can_access(tsid));
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

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 038 complete — teacher role ready' AS result;
