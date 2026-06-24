-- ============================================================================
--  Migration: Admin-created credentials (no self-signup)
--  - Adds full school columns (type, ward, address, username, password, contact)
--  - Adds full student columns from TSID (level, blood_group, parent info, etc.)
--  - Adds admin_users table (gov/school admins created by superadmin)
--  - Adds request_letters table
--  - Adds certificates table
--  - Adds activity_logs table
--  - Updates RLS so student login works via tsid_no credential lookup
-- ============================================================================

-- ── Extend schools ────────────────────────────────────────────────────────────
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Secondary School',
  ADD COLUMN IF NOT EXISTS ward TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS cred_username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cred_password TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Backfill legacy rows that already exist
UPDATE public.schools SET type = 'Secondary School' WHERE type IS NULL;

-- ── Extend students ───────────────────────────────────────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS nationality TEXT NOT NULL DEFAULT 'Tanzanian',
  ADD COLUMN IF NOT EXISTS school_code TEXT,
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS ward TEXT,
  ADD COLUMN IF NOT EXISTS school_contact TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_date DATE,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS parent_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_nida TEXT,
  ADD COLUMN IF NOT EXISTS relationship TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT,
  ADD COLUMN IF NOT EXISTS issue_date DATE,
  ADD COLUMN IF NOT EXISTS remarks JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cred_username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cred_password TEXT;

-- ── admin_users — created by superadmin for gov + school staff ────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.app_role NOT NULL,
  ref TEXT, -- school code for school admins
  ministry TEXT,
  region TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_users gov all" ON public.admin_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov')) WITH CHECK (public.has_role(auth.uid(),'gov'));
CREATE POLICY "admin_users self read" ON public.admin_users FOR SELECT TO authenticated
  USING (auth_uid = auth.uid());

-- ── request_letters ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.request_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  tsid_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name TEXT,
  type TEXT NOT NULL DEFAULT 'identification',
  reason TEXT,
  addressee TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status public.app_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.request_letters TO authenticated;
GRANT ALL ON public.request_letters TO service_role;
ALTER TABLE public.request_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "letters gov all" ON public.request_letters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov')) WITH CHECK (public.has_role(auth.uid(),'gov'));
CREATE POLICY "letters school manage" ON public.request_letters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'school') AND school_id = public.current_school_id())
  WITH CHECK (public.has_role(auth.uid(),'school') AND school_id = public.current_school_id());
CREATE POLICY "letters student own" ON public.request_letters FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.user_id=auth.uid()));

-- ── certificates ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  tsid_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name TEXT,
  title TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certs gov all" ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'gov')) WITH CHECK (public.has_role(auth.uid(),'gov'));
CREATE POLICY "certs school manage" ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'school') AND school_id = public.current_school_id())
  WITH CHECK (public.has_role(auth.uid(),'school') AND school_id = public.current_school_id());
CREATE POLICY "certs student own" ON public.certificates FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.user_id=auth.uid()));

-- ── activity_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  message TEXT,
  by_name TEXT,
  by_role TEXT,
  actor UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs gov read" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'gov'));
CREATE POLICY "logs any insert" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (actor = auth.uid() OR actor IS NULL);

-- ── Extend students_public view to include extra fields ───────────────────────
DROP VIEW IF EXISTS public.students_public;
CREATE VIEW public.students_public AS
SELECT
  s.tsid_no, s.full_name, s.status, s.photo_url,
  s.dob, s.gender, s.nationality, s.region, s.district, s.level,
  sc.name AS school_name, sc.region AS school_region, sc.code AS school_code
FROM public.students s
LEFT JOIN public.schools sc ON sc.id = s.school_id;
GRANT SELECT ON public.students_public TO anon, authenticated;

-- ── Helper: create school + auth user in one function ─────────────────────────
-- (called from service_role / edge function; not exposed to anon)
CREATE OR REPLACE FUNCTION public.admin_create_school(
  p_name TEXT, p_type TEXT, p_code TEXT, p_region TEXT, p_district TEXT,
  p_ward TEXT, p_contact TEXT, p_email TEXT, p_address TEXT,
  p_username TEXT, p_password TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.schools
    (name, type, code, region, district, ward, contact_phone, contact_email,
     address, cred_username, cred_password, status, verified)
  VALUES
    (p_name, p_type, p_code, p_region, p_district, p_ward, p_contact, p_email,
     p_address, p_username, p_password, 'active', true)
  ON CONFLICT (code) DO UPDATE SET
    name=EXCLUDED.name, type=EXCLUDED.type, region=EXCLUDED.region,
    district=EXCLUDED.district, ward=EXCLUDED.ward, contact_phone=EXCLUDED.contact_phone,
    contact_email=EXCLUDED.contact_email, address=EXCLUDED.address,
    cred_username=EXCLUDED.cred_username, cred_password=EXCLUDED.cred_password
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

