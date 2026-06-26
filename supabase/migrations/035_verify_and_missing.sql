-- ============================================================================
-- Migration 035: public verification + missing-child flag + dev audit trail
-- ============================================================================

-- 1) Missing-child flow: SCHOOL reports → GOV ADMIN activates public badge.
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS missing_reported     BOOLEAN DEFAULT false;  -- school-initiated
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS missing_reported_by  TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS missing_reported_at  TIMESTAMPTZ;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS missing       BOOLEAN DEFAULT false;          -- gov-activated public badge
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS missing_since TIMESTAMPTZ;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS missing_note  TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS missing_by    TEXT;

-- 2) Public verification function — returns ONLY safe fields, no contacts.
--    SECURITY DEFINER so it can read students without exposing the table via RLS.
CREATE OR REPLACE FUNCTION public.verify_student(p_tsid TEXT)
RETURNS TABLE (
  tsid TEXT, fullname TEXT, photo TEXT, dob TEXT, level TEXT,
  school_name TEXT, region TEXT, district TEXT, status TEXT, missing BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.tsid, s.fullname, s.photo, s.dob, s.level,
         s.school_name, s.region, s.district, s.status, COALESCE(s.missing, false)
  FROM public.students s
  WHERE upper(s.tsid) = upper(p_tsid)
  LIMIT 1;
$$;

-- 3) Emergency contacts — ONLY for missing students, ONLY to gov admins.
CREATE OR REPLACE FUNCTION public.missing_contacts(p_tsid TEXT)
RETURNS TABLE (
  tsid TEXT, fullname TEXT, parent_name TEXT, parent_phone TEXT,
  emergency_contact_name TEXT, emergency_contact_phone TEXT,
  home_address TEXT, missing_since TIMESTAMPTZ, missing_note TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.tsid, s.fullname, s.parent_name, s.parent_phone,
         s.emergency_contact_name, s.emergency_contact_phone,
         s.home_address, s.missing_since, s.missing_note
  FROM public.students s
  WHERE upper(s.tsid) = upper(p_tsid)
    AND s.missing = true
    AND public.is_gov();   -- gov tiers only
$$;

-- Helper: any gov tier
CREATE OR REPLACE FUNCTION public.is_gov()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_uid = auth.uid() AND role IN ('gov','admin','gov_region','gov_district')
  );
$$;

-- Allow anon + authenticated to call the public verify; contacts gated inside.
GRANT EXECUTE ON FUNCTION public.verify_student(TEXT)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.missing_contacts(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_gov()               TO authenticated;

-- 4) School verification (public-safe)
CREATE OR REPLACE FUNCTION public.verify_school(p_code TEXT)
RETURNS TABLE (school_code TEXT, school_name TEXT, type TEXT, region TEXT, district TEXT, status TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.school_code, s.school_name, s.type, s.region, s.district, s.status
  FROM public.schools s WHERE upper(s.school_code) = upper(p_code) LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_school(TEXT) TO anon, authenticated;

-- 5) Development audit trail
CREATE TABLE IF NOT EXISTS public.development_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tsid        TEXT NOT NULL,
  record_id   UUID,
  school_code TEXT,
  action      TEXT NOT NULL,          -- 'create' | 'update' | 'delete'
  year        INT,
  term        TEXT,
  changes     JSONB DEFAULT '{}'::jsonb,  -- field → {old,new}
  actor_uid   UUID,
  actor_name  TEXT,
  actor_role  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_devaudit_tsid ON public.development_audit(tsid);

ALTER TABLE public.development_audit ENABLE ROW LEVEL SECURITY;

-- Read: student own, school own, gov. Insert: school/gov (append-only).
DROP POLICY IF EXISTS "devaudit read" ON public.development_audit;
CREATE POLICY "devaudit read" ON public.development_audit FOR SELECT TO authenticated
USING (
  (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);
DROP POLICY IF EXISTS "devaudit insert" ON public.development_audit;
CREATE POLICY "devaudit insert" ON public.development_audit FOR INSERT TO authenticated
WITH CHECK (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
);
-- No update/delete policy → append-only (immutable audit trail).

GRANT SELECT, INSERT ON public.development_audit TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 035 complete — verify functions, missing flag, dev audit' AS result;
