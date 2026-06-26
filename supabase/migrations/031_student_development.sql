-- ============================================================================
-- Migration 031: student development records (remarks per year + term)
-- School/teacher fills remarks across 6 categories, per academic year+term+level.
-- Progress = every year from start_level → current level present, each with all
-- 6 categories filled.
-- ============================================================================

-- Track where the student STARTED (so we know the required span to "now").
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS start_level TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS start_year  INT;

CREATE TABLE IF NOT EXISTS public.student_development (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tsid          TEXT NOT NULL,
  school_code   TEXT NOT NULL,
  year          INT  NOT NULL,           -- academic year e.g. 2025
  term          TEXT NOT NULL,           -- 'Term 1' | 'Term 2' | 'Annual'
  level         TEXT,                    -- class that year e.g. 'Standard 3'

  behaviour_remark   TEXT,               -- 1. Behaviour
  exams_remark       TEXT,               -- 2. Exams overall
  attendance_remark  TEXT,               -- 3. Attendance
  social_remark      TEXT,               -- 4. Social
  special_remark     TEXT,               -- 5. Special
  other_remark       TEXT,               -- 6. Other development

  created_by    UUID,
  created_by_name TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tsid, year, term)
);

CREATE INDEX IF NOT EXISTS idx_dev_tsid   ON public.student_development(tsid);
CREATE INDEX IF NOT EXISTS idx_dev_school ON public.student_development(school_code);

ALTER TABLE public.student_development ENABLE ROW LEVEL SECURITY;

-- READ: student own, school own, gov scope
DROP POLICY IF EXISTS "dev read" ON public.student_development;
CREATE POLICY "dev read" ON public.student_development FOR SELECT TO authenticated
USING (
  (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

-- WRITE (insert/update/delete): school own + gov (NOT student — read only)
DROP POLICY IF EXISTS "dev insert" ON public.student_development;
CREATE POLICY "dev insert" ON public.student_development FOR INSERT TO authenticated
WITH CHECK (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

DROP POLICY IF EXISTS "dev update" ON public.student_development;
CREATE POLICY "dev update" ON public.student_development FOR UPDATE TO authenticated
USING (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

DROP POLICY IF EXISTS "dev delete" ON public.student_development;
CREATE POLICY "dev delete" ON public.student_development FOR DELETE TO authenticated
USING (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_development TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 031 complete — student_development ready' AS result;
