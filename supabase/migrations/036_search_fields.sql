-- ============================================================================
-- Migration 036: extra searchable fields + multi-field verify search
-- ============================================================================

-- Student own identifiers
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nida         TEXT;  -- student NIDA (if any)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_cert   TEXT;  -- birth certificate no
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone        TEXT;  -- student mobile

-- School identifiers / contacts
ALTER TABLE public.schools  ADD COLUMN IF NOT EXISTS reg_number   TEXT;  -- registration number
ALTER TABLE public.schools  ADD COLUMN IF NOT EXISTS phone        TEXT;  -- school mobile
ALTER TABLE public.schools  ADD COLUMN IF NOT EXISTS email        TEXT;

-- ── Multi-field STUDENT search (public-safe) ──
-- Matches tsid / name / any exam index / nida / birth cert / mobile.
CREATE OR REPLACE FUNCTION public.search_student(p_q TEXT)
RETURNS TABLE (
  tsid TEXT, fullname TEXT, photo TEXT, dob TEXT, level TEXT,
  school_name TEXT, school_type TEXT, region TEXT, district TEXT,
  status TEXT, disability TEXT, phone TEXT, missing BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.tsid, s.fullname, s.photo, s.dob, s.level,
         s.school_name, s.school_type, s.region, s.district,
         s.status, s.disability, s.phone, COALESCE(s.missing, false)
  FROM public.students s
  WHERE p_q IS NOT NULL AND length(trim(p_q)) >= 2 AND (
       upper(s.tsid)        = upper(trim(p_q))
    OR s.fullname          ILIKE '%' || trim(p_q) || '%'
    OR s.nida               = trim(p_q)
    OR s.birth_cert         = trim(p_q)
    OR regexp_replace(coalesce(s.phone,''), '\D', '', 'g') = regexp_replace(trim(p_q), '\D', '', 'g')
    OR upper(coalesce(s.idx_std4,''))       = upper(trim(p_q))
    OR upper(coalesce(s.idx_std6,''))       = upper(trim(p_q))
    OR upper(coalesce(s.idx_std7,''))       = upper(trim(p_q))
    OR upper(coalesce(s.idx_form2,''))      = upper(trim(p_q))
    OR upper(coalesce(s.idx_form4,''))      = upper(trim(p_q))
    OR upper(coalesce(s.idx_form6,''))      = upper(trim(p_q))
    OR upper(coalesce(s.idx_college,''))    = upper(trim(p_q))
    OR upper(coalesce(s.idx_university,'')) = upper(trim(p_q))
    OR upper(coalesce(s.idx_vocational,'')) = upper(trim(p_q))
  )
  ORDER BY (upper(s.tsid) = upper(trim(p_q))) DESC, s.fullname
  LIMIT 15;
$$;

-- ── Multi-field SCHOOL search (public-safe) ──
-- Matches code / name / mobile / reg number.
CREATE OR REPLACE FUNCTION public.search_school(p_q TEXT)
RETURNS TABLE (
  school_code TEXT, school_name TEXT, type TEXT, region TEXT, district TEXT,
  status TEXT, phone TEXT, reg_number TEXT, category TEXT, fee_exempt BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.school_code, s.school_name, s.type, s.region, s.district,
         s.status, s.phone, s.reg_number, s.category, COALESCE(s.fee_exempt,false)
  FROM public.schools s
  WHERE p_q IS NOT NULL AND length(trim(p_q)) >= 2 AND (
       upper(s.school_code)  = upper(trim(p_q))
    OR s.school_name        ILIKE '%' || trim(p_q) || '%'
    OR upper(coalesce(s.reg_number,'')) = upper(trim(p_q))
    OR regexp_replace(coalesce(s.phone,''), '\D','','g') = regexp_replace(trim(p_q),'\D','','g')
  )
  ORDER BY (upper(s.school_code) = upper(trim(p_q))) DESC, s.school_name
  LIMIT 15;
$$;

GRANT EXECUTE ON FUNCTION public.search_student(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_school(TEXT)  TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 036 complete — multi-field search ready' AS result;
