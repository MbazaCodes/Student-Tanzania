-- ============================================================================
-- Migration 020: change request / approval workflow
-- Student & school profile edits create a change_request that must be approved.
--   entity = 'student' | 'school'
--   severity = 'major' | 'minor'
--   Student MAJOR (name, dob, tsid, school transfer) → approver_level 'admin'
--   Student MINOR (photo, phone, address, parent contact) → approver_level 'school'
--   School edits → approver_level 'admin'
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.change_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity         TEXT NOT NULL,                       -- 'student' | 'school'
  entity_ref     TEXT NOT NULL,                       -- tsid or school_code
  entity_name    TEXT,                                -- display name
  severity       TEXT NOT NULL DEFAULT 'minor',       -- 'major' | 'minor'
  approver_level TEXT NOT NULL,                        -- 'admin' | 'school'
  changes        JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { field: {old, new} }
  status         TEXT NOT NULL DEFAULT 'pending',      -- pending | approved | rejected
  requested_by   UUID,                                -- auth uid
  requested_by_name TEXT,
  requested_by_role TEXT,
  region         TEXT,
  district       TEXT,
  school_code    TEXT,
  reviewer       UUID,
  reviewer_name  TEXT,
  review_note    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cr_status ON public.change_requests(status);
CREATE INDEX IF NOT EXISTS idx_cr_approver ON public.change_requests(approver_level);
CREATE INDEX IF NOT EXISTS idx_cr_school ON public.change_requests(school_code);

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- READ: requester sees own; school sees its school requests; gov sees by scope
DROP POLICY IF EXISTS "cr read scope" ON public.change_requests;
CREATE POLICY "cr read scope"
ON public.change_requests FOR SELECT TO authenticated
USING (
  requested_by = auth.uid()
  OR public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
);

-- INSERT: any authenticated user can request a change for their own scope
DROP POLICY IF EXISTS "cr insert" ON public.change_requests;
CREATE POLICY "cr insert"
ON public.change_requests FOR INSERT TO authenticated
WITH CHECK (requested_by = auth.uid());

-- UPDATE (review): admin for approver_level='admin'; school for 'school'
DROP POLICY IF EXISTS "cr review" ON public.change_requests;
CREATE POLICY "cr review"
ON public.change_requests FOR UPDATE TO authenticated
USING (
  (approver_level = 'admin' AND (
      public.is_national()
      OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
      OR (public.my_district() IS NOT NULL AND district = public.my_district())
  ))
  OR (approver_level = 'school' AND public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
);

GRANT SELECT, INSERT, UPDATE ON public.change_requests TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 020 complete — change_requests ready' AS result;
