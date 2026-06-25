-- ============================================================================
-- Migration 022: student letter requests
-- Student requests an official letter → school approves → student downloads PDF
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.letter_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tsid          TEXT NOT NULL,
  student_name  TEXT,
  school_code   TEXT NOT NULL,
  school_name   TEXT,
  sector        TEXT NOT NULL,                -- 'government' | 'private'
  purpose       TEXT NOT NULL,                -- e.g. 'NHIF', 'Internship', or custom
  reason        TEXT,                         -- free-text detail / 'Other' input
  recipient_name    TEXT,                     -- addressed-to
  recipient_address TEXT,
  region        TEXT,
  district      TEXT,
  fee_type      TEXT NOT NULL DEFAULT 'free', -- 'free' | 'paid'
  amount        NUMERIC DEFAULT 0,
  paid          BOOLEAN DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  ref_no        TEXT,                         -- generated on approval
  reviewer      UUID,
  reviewer_name TEXT,
  review_note   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lr_tsid ON public.letter_requests(tsid);
CREATE INDEX IF NOT EXISTS idx_lr_school ON public.letter_requests(school_code);
CREATE INDEX IF NOT EXISTS idx_lr_status ON public.letter_requests(status);

ALTER TABLE public.letter_requests ENABLE ROW LEVEL SECURITY;

-- Student reads own; school reads its school; gov by scope
DROP POLICY IF EXISTS "lr read" ON public.letter_requests;
CREATE POLICY "lr read" ON public.letter_requests FOR SELECT TO authenticated
USING (
  (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

-- Student inserts own request
DROP POLICY IF EXISTS "lr insert" ON public.letter_requests;
CREATE POLICY "lr insert" ON public.letter_requests FOR INSERT TO authenticated
WITH CHECK (
  (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);

-- School (own) + gov review/update
DROP POLICY IF EXISTS "lr update" ON public.letter_requests;
CREATE POLICY "lr update" ON public.letter_requests FOR UPDATE TO authenticated
USING (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

GRANT SELECT, INSERT, UPDATE ON public.letter_requests TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 022 complete — letter_requests ready' AS result;
