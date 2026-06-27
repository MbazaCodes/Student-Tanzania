-- ============================================================================
-- Migration 039: document uploads
--   - School documents: results, info-center, timetable/publications, assessment
--   - Parent verification docs (ID, birth certificate) → verified guardian
--   - Student birth certificate already added (036); ensure present
-- ============================================================================

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_cert TEXT;  -- ensure exists

-- Parent verification status
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope        TEXT NOT NULL,        -- 'school' | 'student' | 'parent'
  school_code  TEXT,                 -- owning school (for school/student docs)
  tsid         TEXT,                 -- student (for student-scoped docs)
  owner_ref    TEXT,                 -- uploader ref (parent email / teacher / school)
  category     TEXT NOT NULL,        -- 'results'|'timetable'|'publication'|'assessment'|'info'|'id'|'birth_cert'|'other'
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,        -- storage URL
  level        TEXT,                 -- class/level it applies to (optional)
  note         TEXT,
  uploaded_by  TEXT,
  uploaded_role TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_school ON public.documents(school_code);
CREATE INDEX IF NOT EXISTS idx_doc_tsid   ON public.documents(tsid);
CREATE INDEX IF NOT EXISTS idx_doc_scope  ON public.documents(scope);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- READ:
--  school docs → same school (school/teacher), students of that school, gov
--  student docs → that student, their school, their parent, gov
--  parent docs → that parent, gov (for verification)
DROP POLICY IF EXISTS "doc read" ON public.documents;
CREATE POLICY "doc read" ON public.documents FOR SELECT TO authenticated
USING (
  public.is_national()
  OR (scope = 'school' AND school_code = public.my_school_code())
  OR (scope = 'school' AND school_code = public.my_teacher_school())
  OR (scope = 'school' AND tsid IS NULL AND public.my_tsid() IS NOT NULL
       AND school_code = (SELECT s.school_code FROM public.students s WHERE s.tsid = public.my_tsid()))
  OR (scope = 'student' AND public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (scope = 'student' AND school_code = public.my_school_code())
  OR (scope = 'student' AND public.parent_owns(tsid))
  OR (scope = 'student' AND public.teacher_can_access(tsid))
  OR (scope = 'parent' AND owner_ref = public.my_parent_ref())
);

-- INSERT:
--  school/teacher upload school+student docs; parent uploads own verification docs
DROP POLICY IF EXISTS "doc insert" ON public.documents;
CREATE POLICY "doc insert" ON public.documents FOR INSERT TO authenticated
WITH CHECK (
  public.is_national()
  OR (school_code = public.my_school_code())
  OR (school_code = public.my_teacher_school())
  OR (scope = 'parent' AND owner_ref = public.my_parent_ref())
);

DROP POLICY IF EXISTS "doc delete" ON public.documents;
CREATE POLICY "doc delete" ON public.documents FOR DELETE TO authenticated
USING (
  public.is_national()
  OR (school_code = public.my_school_code())
  OR (scope = 'parent' AND owner_ref = public.my_parent_ref())
);

GRANT SELECT, INSERT, DELETE ON public.documents TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 039 complete — documents ready' AS result;

-- Storage bucket for documents (run once; ignore if exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/read documents bucket
DROP POLICY IF EXISTS "docs upload" ON storage.objects;
CREATE POLICY "docs upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');
DROP POLICY IF EXISTS "docs read" ON storage.objects;
CREATE POLICY "docs read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'documents');
DROP POLICY IF EXISTS "docs delete" ON storage.objects;
CREATE POLICY "docs delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');
