-- ============================================================================
-- Migration 033: field study / internship / work-attachment records
-- For tertiary students (college/university/vocational) who do field work
-- while studying. Builds toward a work-experience record.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.field_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tsid          TEXT NOT NULL,
  school_code   TEXT NOT NULL,

  year          INT,
  attachment_type TEXT,                  -- 'Internship' | 'Field Study' | 'Work-Study' | 'Practical Training'
  sector        TEXT NOT NULL,           -- 'government' | 'private'
  institution   TEXT NOT NULL,           -- organisation / industry name
  industry      TEXT,                    -- sector/industry category
  job_title     TEXT,
  designation   TEXT,
  region        TEXT,
  district      TEXT,
  start_date    DATE,
  end_date      DATE,
  duties        TEXT,                    -- responsibilities / duties

  report_to_name  TEXT,                  -- supervisor name
  report_to_phone TEXT,
  report_to_email TEXT,

  kpis          JSONB DEFAULT '[]'::jsonb,  -- [{ name, target, achieved, score }]
  remark        TEXT,
  rating        TEXT,                    -- Excellent..Concern
  score         INT,                     -- overall %

  created_by    UUID,
  created_by_name TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fa_tsid   ON public.field_attachments(tsid);
CREATE INDEX IF NOT EXISTS idx_fa_school ON public.field_attachments(school_code);

ALTER TABLE public.field_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fa read" ON public.field_attachments;
CREATE POLICY "fa read" ON public.field_attachments FOR SELECT TO authenticated
USING (
  (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

DROP POLICY IF EXISTS "fa write" ON public.field_attachments;
CREATE POLICY "fa write" ON public.field_attachments FOR INSERT TO authenticated
WITH CHECK (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

DROP POLICY IF EXISTS "fa update" ON public.field_attachments;
CREATE POLICY "fa update" ON public.field_attachments FOR UPDATE TO authenticated
USING (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

DROP POLICY IF EXISTS "fa delete" ON public.field_attachments;
CREATE POLICY "fa delete" ON public.field_attachments FOR DELETE TO authenticated
USING (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_attachments TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 033 complete — field_attachments ready' AS result;
