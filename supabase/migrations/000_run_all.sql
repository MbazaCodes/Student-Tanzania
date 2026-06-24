-- ============================================================================
-- TSID: FOUNDATION & SCHEMA RESET
-- Phase-0 legacy schema + full reset to Phase-1 TSID schema
-- Merged files: 6
-- ============================================================================

-- ------------------------------------------------------------
-- 20260623204219_a97a1f41-805a-49a8-8982-b41a803ce9a9.sql
-- ------------------------------------------------------------
-- Enum
CREATE TYPE public.app_role AS ENUM ('gov','school','student');
CREATE TYPE public.student_status AS ENUM ('active','suspended','graduated','revoked');
CREATE TYPE public.app_status AS ENUM ('pending','approved','rejected');

-- Schools
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  region TEXT,
  district TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schools TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  tsid_no TEXT, -- for student-role users, links to their student row
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT school_id FROM public.profiles WHERE id=auth.uid() $$;

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tsid_no TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  photo_url TEXT,
  status public.student_status NOT NULL DEFAULT 'active',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  qr_payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Public sanitized view
CREATE VIEW public.students_public AS
SELECT s.tsid_no, s.full_name, s.status, s.photo_url, sc.name AS school_name, sc.region
FROM public.students s LEFT JOIN public.schools sc ON sc.id = s.school_id;
GRANT SELECT ON public.students_public TO anon, authenticated;

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status public.app_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====
-- profiles
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (id=auth.uid() OR public.has_role(auth.uid(),'gov'));
CREATE POLICY "profiles self upsert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id=auth.uid());
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK (id=auth.uid());

-- user_roles
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'gov'));

-- schools
CREATE POLICY "schools public read" ON public.schools FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "schools gov manage" ON public.schools FOR ALL TO authenticated USING (public.has_role(auth.uid(),'gov')) WITH CHECK (public.has_role(auth.uid(),'gov'));
CREATE POLICY "schools school self update" ON public.schools FOR UPDATE TO authenticated USING (id = public.current_school_id()) WITH CHECK (id = public.current_school_id());

-- students
CREATE POLICY "students gov all" ON public.students FOR ALL TO authenticated USING (public.has_role(auth.uid(),'gov')) WITH CHECK (public.has_role(auth.uid(),'gov'));
CREATE POLICY "students school manage" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'school') AND school_id = public.current_school_id())
  WITH CHECK (public.has_role(auth.uid(),'school') AND school_id = public.current_school_id());
CREATE POLICY "students self read" ON public.students FOR SELECT TO authenticated USING (user_id=auth.uid());

-- applications
CREATE POLICY "apps gov all" ON public.applications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'gov')) WITH CHECK (public.has_role(auth.uid(),'gov'));
CREATE POLICY "apps school manage" ON public.applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'school') AND EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.school_id=public.current_school_id()))
  WITH CHECK (public.has_role(auth.uid(),'school') AND EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.school_id=public.current_school_id()));
CREATE POLICY "apps student own" ON public.applications FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.user_id=auth.uid()));

-- payments
CREATE POLICY "pay gov all" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'gov')) WITH CHECK (public.has_role(auth.uid(),'gov'));
CREATE POLICY "pay school manage" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'school') AND EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.school_id=public.current_school_id()))
  WITH CHECK (public.has_role(auth.uid(),'school') AND EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.school_id=public.current_school_id()));
CREATE POLICY "pay student own" ON public.payments FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.user_id=auth.uid()));

-- audit_logs
CREATE POLICY "audit gov read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'gov'));
CREATE POLICY "audit any insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor=auth.uid());

-- Trigger: auto-create profile + role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  chosen_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
          NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  chosen_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'student')::public.app_role;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, chosen_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER students_touch BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed a few demo schools so the UI isn't empty
INSERT INTO public.schools (name, code, region, district, verified) VALUES
  ('Azania Secondary School','TZ-DSM-001','Dar es Salaam','Ilala',true),
  ('Mzumbe Secondary School','TZ-MOR-002','Morogoro','Mvomero',true),
  ('Tabora Boys Secondary','TZ-TAB-003','Tabora','Tabora Urban',true),
  ('Mwanza Girls High School','TZ-MWZ-004','Mwanza','Nyamagana',true),
  ('Kibaha Education Centre','TZ-PWA-005','Pwani','Kibaha',false);

-- ------------------------------------------------------------
-- 20260623204241_3ca8feb8-75d6-4f4b-b095-5e911dd2bbe6.sql
-- ------------------------------------------------------------
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

DROP VIEW IF EXISTS public.students_public;
CREATE VIEW public.students_public WITH (security_invoker = true) AS
SELECT s.tsid_no, s.full_name, s.status, s.photo_url, sc.name AS school_name, sc.region
FROM public.students s LEFT JOIN public.schools sc ON sc.id = s.school_id;
GRANT SELECT ON public.students_public TO anon, authenticated;

-- Need a policy that lets anon SELECT students for the view (security_invoker uses caller perms)
CREATE POLICY "students public read" ON public.students FOR SELECT TO anon USING (true);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_school_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_school_id() TO authenticated;

-- ------------------------------------------------------------
-- 20260623204259_612bf8be-7714-4cc2-85d2-0bd4edafe8b6.sql
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "students public read" ON public.students;
DROP VIEW IF EXISTS public.students_public;

CREATE OR REPLACE FUNCTION public.search_student(_tsid_no TEXT)
RETURNS TABLE(tsid_no TEXT, full_name TEXT, status public.student_status, photo_url TEXT, school_name TEXT, region TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.tsid_no, s.full_name, s.status, s.photo_url, sc.name, sc.region
  FROM public.students s LEFT JOIN public.schools sc ON sc.id = s.school_id
  WHERE s.tsid_no = _tsid_no
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.search_student(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_student(text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 20260624_admin_created_credentials.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 20260624_grant_gov_admin_support.sql
-- ------------------------------------------------------------
-- ============================================================
--  Grant gov admin access to support@tsid.go.tz
--  User UID: a083ddd1-66a0-4439-87e8-bf77af03f32a
-- ============================================================

-- 1. Upsert user_roles → gov
INSERT INTO public.user_roles (user_id, role)
VALUES ('a083ddd1-66a0-4439-87e8-bf77af03f32a', 'gov')
ON CONFLICT (user_id) DO UPDATE SET role = 'gov';

-- 2. Ensure profile exists (full_name for dashboard greeting)
INSERT INTO public.profiles (id, full_name)
VALUES ('a083ddd1-66a0-4439-87e8-bf77af03f32a', 'TSID Support Admin')
ON CONFLICT (id) DO UPDATE SET full_name = COALESCE(profiles.full_name, 'TSID Support Admin');

-- 3. Upsert into admin_users table (gov staff record)
INSERT INTO public.admin_users (auth_uid, name, email, role, ministry, status)
VALUES (
  'a083ddd1-66a0-4439-87e8-bf77af03f32a',
  'TSID Support Admin',
  'support@tsid.go.tz',
  'gov',
  'Wizara ya Elimu, Sayansi na Teknolojia',
  'active'
)
ON CONFLICT (auth_uid) DO UPDATE SET
  role   = 'gov',
  status = 'active',
  ministry = 'Wizara ya Elimu, Sayansi na Teknolojia';

-- 4. Log the action
INSERT INTO public.activity_logs (action, message, by_name, by_role)
VALUES (
  'auth:grant_gov',
  'Granted gov admin role to support@tsid.go.tz (UID: a083ddd1-66a0-4439-87e8-bf77af03f32a)',
  'System Migration',
  'gov'
);

-- ------------------------------------------------------------
-- 20260624062147_df39f6f6-d4f9-4eb2-95fe-014851eefb35.sql
-- ------------------------------------------------------------
-- ============================================================================
-- TSID Schema Replacement
-- Drops Phase-1 schema and installs uploaded TSID migrations
-- ============================================================================

-- 0) Drop existing Phase-1 objects ------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.current_school_id() CASCADE;
DROP FUNCTION IF EXISTS public.search_student(text) CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;

DROP TABLE IF EXISTS public.audit_logs       CASCADE;
DROP TABLE IF EXISTS public.payments         CASCADE;
DROP TABLE IF EXISTS public.applications     CASCADE;
DROP TABLE IF EXISTS public.students         CASCADE;
DROP TABLE IF EXISTS public.schools          CASCADE;
DROP TABLE IF EXISTS public.user_roles       CASCADE;
DROP TABLE IF EXISTS public.profiles         CASCADE;

DROP TYPE IF EXISTS public.app_role           CASCADE;
DROP TYPE IF EXISTS public.student_status     CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;
DROP TYPE IF EXISTS public.payment_status     CASCADE;

-- 00) Extensions & enums ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role         AS ENUM ('admin','gov','school','student');
CREATE TYPE account_status    AS ENUM ('active','inactive','suspended');
CREATE TYPE application_status AS ENUM ('pending','approved','rejected');
CREATE TYPE payment_status    AS ENUM ('pending','paid','failed','cancelled');
CREATE TYPE payment_method    AS ENUM ('M-Pesa','Tigo Pesa','Airtel Money','Bank Transfer','Cash','Halopesa','AzamPay');
CREATE TYPE letter_urgency    AS ENUM ('normal','urgent','very_urgent');
CREATE TYPE letter_status     AS ENUM ('pending','approved','rejected','issued');
CREATE TYPE school_type       AS ENUM ('Primary School','Secondary School','University / College','Vocational Training','Special Needs School');
CREATE TYPE gender_type       AS ENUM ('Male','Female');

-- 01) Admin users, schools, activity_logs ---------------------------------------
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'admin',
  ref         TEXT,
  phone       TEXT,
  region      TEXT,
  ministry    TEXT,
  status      account_status NOT NULL DEFAULT 'active',
  password    TEXT NOT NULL,
  auth_uid    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT admin_users_password_hash CHECK (length(password) = 64)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

CREATE OR REPLACE FUNCTION trg_admin_users_ts() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION trg_admin_users_ts();

CREATE TABLE schools (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        school_type NOT NULL DEFAULT 'Secondary School',
  region      TEXT NOT NULL,
  district    TEXT NOT NULL,
  ward        TEXT NOT NULL,
  contact     TEXT,
  email       TEXT,
  address     TEXT,
  status      account_status NOT NULL DEFAULT 'active',
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT schools_code_format CHECK (code ~* '^[A-Z]{2}[0-9]{4,6}$'),
  CONSTRAINT schools_password_hash CHECK (length(password) = 64),
  CONSTRAINT schools_contact_valid CHECK (contact IS NULL OR contact ~* '^\+?[0-9\s]{10,20}$')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;

CREATE OR REPLACE FUNCTION trg_schools_ts() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION trg_schools_ts();

CREATE TABLE activity_logs (
  id          TEXT PRIMARY KEY DEFAULT 'LOG-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),
  action      TEXT NOT NULL,
  message     TEXT,
  by_name     TEXT,
  by_role     TEXT,
  by_ref      TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_action     ON activity_logs (action);
CREATE INDEX idx_activity_logs_by_role    ON activity_logs (by_role);

CREATE OR REPLACE FUNCTION hash_password(plain_text TEXT) RETURNS TEXT AS $$
  SELECT encode(digest(plain_text,'sha256'),'hex');
$$ LANGUAGE SQL IMMUTABLE STRICT;

-- RLS admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_own_admin" ON admin_users
  FOR SELECT TO authenticated USING (auth_uid = auth.uid());
CREATE POLICY "admin_all_admin_users" ON admin_users
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.auth_uid = auth.uid() AND a.role='admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.auth_uid = auth.uid() AND a.role='admin'));

-- RLS schools
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_gov_all_schools" ON schools
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "school_read_schools" ON schools
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role='school'));
CREATE POLICY "school_update_own" ON schools
  FOR UPDATE TO authenticated
  USING (code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'))
  WITH CHECK (code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'));

-- RLS activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_gov_select_logs" ON activity_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "admin_gov_insert_logs" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "school_insert_logs" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role='school'));
CREATE POLICY "admin_delete_logs" ON activity_logs
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role='admin'));

-- 03) STUDENTS (defined before applications because of FK trigger reference) -----
CREATE TABLE students (
  tsid             TEXT PRIMARY KEY DEFAULT 'TSID-' || to_char(now(),'YYYY') || '-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,7)),
  fullname         TEXT NOT NULL,
  dob              DATE,
  gender           gender_type,
  nationality      TEXT DEFAULT 'Tanzanian',
  school_name      TEXT,
  school_code      TEXT NOT NULL REFERENCES schools(code) ON DELETE SET NULL,
  region           TEXT NOT NULL,
  district         TEXT NOT NULL,
  ward             TEXT NOT NULL,
  school_contact   TEXT,
  enrollment_date  DATE,
  level            TEXT NOT NULL,
  blood_group      TEXT,
  parent_name      TEXT,
  parent_nida      TEXT,
  relationship     TEXT,
  parent_phone     TEXT,
  issue_date       DATE,
  photo            TEXT,
  status           account_status NOT NULL DEFAULT 'active',
  remarks          JSONB NOT NULL DEFAULT '[]',
  cred_username    TEXT NOT NULL,
  cred_password    TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT students_tsid_format     CHECK (tsid ~* '^TSID-[0-9]{4}-[A-Z0-9]{7}$'),
  CONSTRAINT students_nida_valid      CHECK (parent_nida IS NULL OR parent_nida ~* '^[0-9]{20}$'),
  CONSTRAINT students_phone_valid     CHECK (parent_phone IS NULL OR parent_phone ~* '^\+?[0-9\s]{10,20}$'),
  CONSTRAINT students_password_hash   CHECK (length(cred_password) = 64),
  CONSTRAINT students_level_not_empty CHECK (length(trim(level)) > 0),
  CONSTRAINT students_cred_username_unique UNIQUE (cred_username)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

CREATE INDEX idx_students_school_code   ON students (school_code);
CREATE INDEX idx_students_region        ON students (region);
CREATE INDEX idx_students_level         ON students (level);
CREATE INDEX idx_students_status        ON students (status);
CREATE INDEX idx_students_fullname      ON students (fullname);
CREATE INDEX idx_students_created_at    ON students (created_at DESC);
CREATE INDEX idx_students_cred_username ON students (cred_username);

CREATE OR REPLACE FUNCTION trg_students_ts() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION trg_students_ts();

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_gov_select_students" ON students
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "school_all_own_students" ON students
  FOR ALL TO authenticated
  USING (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'))
  WITH CHECK (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'));
CREATE POLICY "student_select_own" ON students
  FOR SELECT TO authenticated
  USING (tsid = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='student'));

-- 02) APPLICATIONS + PAYMENTS ---------------------------------------------------
CREATE TABLE applications (
  id               TEXT PRIMARY KEY DEFAULT 'APP-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || upper(substr(encode(gen_random_bytes(3),'hex'),1,4)),
  fullname         TEXT NOT NULL,
  dob              DATE,
  gender           gender_type,
  nationality      TEXT DEFAULT 'Tanzanian',
  school_name      TEXT,
  school_code      TEXT NOT NULL REFERENCES schools(code) ON DELETE SET NULL,
  region           TEXT NOT NULL,
  district         TEXT NOT NULL,
  ward             TEXT NOT NULL,
  school_contact   TEXT,
  enrollment_date  DATE,
  level            TEXT NOT NULL,
  blood_group      TEXT,
  parent_name      TEXT,
  parent_nida      TEXT,
  relationship     TEXT,
  parent_phone     TEXT,
  photo            TEXT,
  status           application_status NOT NULL DEFAULT 'pending',
  reject_reason    TEXT,
  tsid             TEXT,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at       TIMESTAMPTZ,
  CONSTRAINT applications_nida_valid  CHECK (parent_nida IS NULL OR parent_nida ~* '^[0-9]{20}$'),
  CONSTRAINT applications_phone_valid CHECK (parent_phone IS NULL OR parent_phone ~* '^\+?[0-9\s]{10,20}$'),
  CONSTRAINT applications_level_not_empty CHECK (length(trim(level)) > 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

CREATE OR REPLACE FUNCTION trg_applications_tsid_check() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tsid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM students WHERE tsid = NEW.tsid) THEN
    RAISE EXCEPTION 'applications.tsid "%" does not exist in students table', NEW.tsid;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_applications_validate_tsid
  BEFORE INSERT OR UPDATE OF tsid ON applications
  FOR EACH ROW EXECUTE FUNCTION trg_applications_tsid_check();

CREATE INDEX idx_applications_school_code ON applications (school_code);
CREATE INDEX idx_applications_status      ON applications (status);
CREATE INDEX idx_applications_submitted   ON applications (submitted_at DESC);
CREATE INDEX idx_applications_tsid        ON applications (tsid) WHERE tsid IS NOT NULL;

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_gov_select_applications" ON applications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "school_all_own_applications" ON applications
  FOR ALL TO authenticated
  USING (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'))
  WITH CHECK (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'));

CREATE TABLE payments (
  ref          TEXT PRIMARY KEY DEFAULT 'PAY-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || upper(substr(encode(gen_random_bytes(2),'hex'),1,4)),
  tsid         TEXT NOT NULL,
  school_code  TEXT NOT NULL REFERENCES schools(code) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'TZS',
  purpose      TEXT DEFAULT 'ID Card Processing',
  method       payment_method,
  status       payment_status NOT NULL DEFAULT 'pending',
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payments_amount_positive CHECK (amount >= 0),
  CONSTRAINT payments_currency_valid  CHECK (currency IS NOT NULL AND length(currency)=3)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

CREATE INDEX idx_payments_school_code ON payments (school_code);
CREATE INDEX idx_payments_tsid        ON payments (tsid);
CREATE INDEX idx_payments_status      ON payments (status);
CREATE INDEX idx_payments_created_at  ON payments (created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_gov_select_payments" ON payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "school_all_own_payments" ON payments
  FOR ALL TO authenticated
  USING (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'))
  WITH CHECK (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'));
CREATE POLICY "student_select_own_payments" ON payments
  FOR SELECT TO authenticated
  USING (tsid = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='student'));

-- Certificates + request_letters -------------------------------------------------
CREATE TABLE certificates (
  id           TEXT PRIMARY KEY DEFAULT 'CRT-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || upper(substr(encode(gen_random_bytes(3),'hex'),1,4)),
  tsid         TEXT NOT NULL REFERENCES students(tsid) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  school_code  TEXT NOT NULL REFERENCES schools(code) ON DELETE SET NULL,
  school_name  TEXT NOT NULL,
  title        TEXT NOT NULL DEFAULT 'Certificate of Enrollment',
  issued_at    DATE NOT NULL DEFAULT current_date,
  ref          TEXT NOT NULL UNIQUE,
  CONSTRAINT certificates_ref_format CHECK (ref ~* '^TSID-CRT-[0-9]+$')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
CREATE INDEX idx_certificates_tsid       ON certificates (tsid);
CREATE INDEX idx_certificates_school_code ON certificates (school_code);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_gov_select_certificates" ON certificates
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "school_all_own_certificates" ON certificates
  FOR ALL TO authenticated
  USING (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'))
  WITH CHECK (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'));
CREATE POLICY "student_select_own_certificates" ON certificates
  FOR SELECT TO authenticated
  USING (tsid = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='student'));

CREATE TABLE request_letters (
  ref          TEXT PRIMARY KEY DEFAULT 'LTR-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || upper(substr(encode(gen_random_bytes(3),'hex'),1,4)),
  tsid         TEXT NOT NULL REFERENCES students(tsid) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  school_code  TEXT NOT NULL REFERENCES schools(code) ON DELETE SET NULL,
  school_name  TEXT NOT NULL,
  type         TEXT NOT NULL,
  reason       TEXT,
  addressee    TEXT,
  urgency      letter_urgency DEFAULT 'normal',
  status       letter_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at  TIMESTAMPTZ,
  CONSTRAINT request_letters_type_valid CHECK (length(trim(type)) > 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_letters TO authenticated;
GRANT ALL ON public.request_letters TO service_role;

CREATE INDEX idx_request_letters_tsid        ON request_letters (tsid);
CREATE INDEX idx_request_letters_school_code ON request_letters (school_code);
CREATE INDEX idx_request_letters_status      ON request_letters (status);
CREATE INDEX idx_request_letters_requested   ON request_letters (requested_at DESC);

ALTER TABLE request_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_gov_select_request_letters" ON request_letters
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "admin_gov_update_request_letters" ON request_letters
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE auth_uid = auth.uid() AND role IN ('admin','gov')));
CREATE POLICY "school_all_own_request_letters" ON request_letters
  FOR ALL TO authenticated
  USING (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'))
  WITH CHECK (school_code = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='school'));
CREATE POLICY "student_select_own_letters" ON request_letters
  FOR SELECT TO authenticated
  USING (tsid = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='student'));
CREATE POLICY "student_insert_own_letters" ON request_letters
  FOR INSERT TO authenticated
  WITH CHECK (tsid = (SELECT ref FROM admin_users WHERE auth_uid = auth.uid() AND role='student'));

CREATE OR REPLACE FUNCTION auto_approve_letter() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status='pending' AND TG_OP='INSERT' THEN
    NEW.status:='approved'; NEW.approved_at:=now();
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_auto_approve_letter BEFORE INSERT ON request_letters
  FOR EACH ROW EXECUTE FUNCTION auto_approve_letter();

-- 04) Public views & helper RPCs ------------------------------------------------
CREATE OR REPLACE VIEW public_student_search WITH (security_invoker=on) AS
SELECT s.tsid, s.fullname, s.gender, s.nationality, s.school_name, s.school_code,
       s.region, s.district, s.level, s.status, s.issue_date, s.created_at,
       sc.name AS school_official_name, sc.type AS school_type, sc.region AS school_region
FROM students s LEFT JOIN schools sc ON sc.code = s.school_code
WHERE s.status = 'active';

CREATE OR REPLACE VIEW public_school_search WITH (security_invoker=on) AS
SELECT sc.code, sc.name, sc.type, sc.region, sc.district, sc.ward, sc.email, sc.status, sc.created_at,
  (SELECT count(*)::int FROM students st WHERE st.school_code = sc.code AND st.status='active') AS total_students
FROM schools sc WHERE sc.status='active';

-- Views need anon SELECT policies on underlying tables; add narrow public policies
CREATE POLICY "anon_public_search_students" ON students
  FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "anon_public_search_schools" ON schools
  FOR SELECT TO anon USING (status = 'active');

GRANT SELECT ON public_student_search TO anon, authenticated;
GRANT SELECT ON public_school_search  TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE (user_id UUID, role TEXT, name TEXT, email TEXT, ref TEXT)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT au.id, au.role::text, au.name, au.email, au.ref
  FROM admin_users au
  WHERE au.auth_uid = auth.uid() AND au.status='active';
$$;
GRANT EXECUTE ON FUNCTION get_user_profile() TO authenticated;

-- Trigger: on new auth.users signup, create a student stub admin_users row
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_role user_role;
  v_name TEXT;
BEGIN
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''),'student')::user_role;
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User');
  INSERT INTO admin_users (auth_uid, email, name, role, password)
  VALUES (NEW.id, NEW.email, v_name, v_role, encode(digest(NEW.id::text,'sha256'),'hex'))
  ON CONFLICT (auth_uid) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Admin bootstrap: bind admin role to existing support@tsid.go.tz user
INSERT INTO admin_users (auth_uid, email, name, role, password)
VALUES (
  'a083ddd1-66a0-4439-87e8-bf77af03f32a'::uuid,
  'support@tsid.go.tz',
  'TSID System Administrator',
  'admin',
  encode(digest('admin123','sha256'),'hex')
)
ON CONFLICT (auth_uid) DO UPDATE SET
  email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role, updated_at = now();

-- ============================================================================
-- TSID: CORE TABLES, RLS & INDEXES (migrations 0001-0050)
-- Profiles, students, schools, regions, districts, security, seeds
-- Merged files: 50
-- ============================================================================

-- ------------------------------------------------------------
-- 202606240001_create_profiles.sql
-- ------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    full_name text not null,

    email text unique,

    role text not null check (
        role in (
            'super_admin',
            'government_admin',
            'regional_admin',
            'school_admin',
            'teacher',
            'student'
        )
    ),

    region text,

    district text,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240002_create_students.sql
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

create table if not exists public.students (

    id uuid primary key default gen_random_uuid(),

    tsid varchar(20) unique not null,

    first_name text not null,

    middle_name text,

    last_name text not null,

    gender text,

    date_of_birth date,

    blood_group text,

    nationality text default 'Tanzanian',

    school_id uuid,

    guardian_name text,

    guardian_phone text,

    student_status text default 'active',

    qr_code text,

    photo_url text,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240003_create_schools.sql
-- ------------------------------------------------------------
create table if not exists public.schools (

    id uuid primary key default gen_random_uuid(),

    school_code varchar(20) unique not null,

    school_name text not null,

    region text,

    district text,

    ward text,

    address text,

    phone text,

    email text,

    status text default 'active',

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240004_create_audit_logs.sql
-- ------------------------------------------------------------
create table if not exists public.audit_logs (

    id bigint generated always as identity primary key,

    table_name text not null,

    record_id text,

    action text,

    old_data jsonb,

    new_data jsonb,

    performed_by uuid,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240005_create_student_history.sql
-- ------------------------------------------------------------
create table if not exists public.student_history (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    school_id uuid references schools(id),

    action text,

    remarks text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240006_enable_rls.sql
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table students enable row level security;
alter table schools enable row level security;
alter table audit_logs enable row level security;
alter table student_history enable row level security;

-- ------------------------------------------------------------
-- 202606240007_security_functions.sql
-- ------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
    select exists (
        select 1
        from profiles
        where id = auth.uid()
        and role = 'super_admin'
    );
$$;
create policy "super admins full access students"
on students
for all
using (public.is_super_admin());

create policy "super admins full access schools"
on schools
for all
using (public.is_super_admin());

create policy "super admins full access profiles"
on profiles
for all
using (public.is_super_admin());

-- ------------------------------------------------------------
-- 202606240008_indexes.sql
-- ------------------------------------------------------------
create index if not exists idx_students_tsid
on students(tsid);

create index if not exists idx_students_school
on students(school_id);

create index if not exists idx_school_code
on schools(school_code);

create index if not exists idx_profiles_role
on profiles(role);

-- ------------------------------------------------------------
-- 202606240009_storage_policies.sql
-- ------------------------------------------------------------
insert into storage.buckets
(id,name,public)
values
('student-photos','student-photos',true)
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240010_create_tsid_generator.sql
-- ------------------------------------------------------------
create sequence if not exists tsid_sequence start 10000001;

create or replace function generate_tsid()
returns text
language plpgsql
as $$
declare
    next_number bigint;
begin
    next_number := nextval('tsid_sequence');

    return 'TSID' || lpad(next_number::text,8,'0');
end;
$$;

-- ------------------------------------------------------------
-- 202606240011_add_tsid_trigger.sql
-- ------------------------------------------------------------
create or replace function assign_tsid()
returns trigger
language plpgsql
as $$
begin

    if new.tsid is null then
        new.tsid := generate_tsid();
    end if;

    return new;

end;
$$;

drop trigger if exists trg_assign_tsid on students;

create trigger trg_assign_tsid
before insert on students
for each row
execute function assign_tsid();

-- ------------------------------------------------------------
-- 202606240012_create_regions.sql
-- ------------------------------------------------------------
create table if not exists regions (

    id uuid primary key default gen_random_uuid(),

    region_code varchar(10) unique not null,

    region_name text unique not null,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240013_create_districts.sql
-- ------------------------------------------------------------
create table if not exists districts (

    id uuid primary key default gen_random_uuid(),

    region_id uuid not null references regions(id),

    district_code varchar(20),

    district_name text not null,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240014_create_wards.sql
-- ------------------------------------------------------------
create table if not exists wards (

    id uuid primary key default gen_random_uuid(),

    district_id uuid not null references districts(id),

    ward_code varchar(20),

    ward_name text not null,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240015_upgrade_schools.sql
-- ------------------------------------------------------------
alter table schools
add column if not exists region_id uuid references regions(id);

alter table schools
add column if not exists district_id uuid references districts(id);

alter table schools
add column if not exists ward_id uuid references wards(id);

alter table schools
add column if not exists latitude numeric;

alter table schools
add column if not exists longitude numeric;

-- ------------------------------------------------------------
-- 202606240016_upgrade_students.sql
-- ------------------------------------------------------------
alter table students
add column if not exists guardian_relationship text;

alter table students
add column if not exists current_region_id uuid references regions(id);

alter table students
add column if not exists current_district_id uuid references districts(id);

alter table students
add column if not exists current_school_id uuid references schools(id);

alter table students
add column if not exists registration_date date default current_date;

alter table students
add column if not exists graduation_date date;

-- ------------------------------------------------------------
-- 202606240017_create_student_transfers.sql
-- ------------------------------------------------------------
create table if not exists student_transfers (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    from_school_id uuid references schools(id),

    to_school_id uuid references schools(id),

    transfer_reason text,

    transferred_by uuid,

    approved_by uuid,

    transfer_date timestamptz default now(),

    status text default 'pending'
);

-- ------------------------------------------------------------
-- 202606240018_create_qr_verification.sql
-- ------------------------------------------------------------
create table if not exists qr_verifications (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    verification_code text unique not null,

    active boolean default true,

    expiry_date timestamptz,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240019_create_document_registry.sql
-- ------------------------------------------------------------
create table if not exists student_documents (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    document_type text not null,

    document_number text,

    file_url text,

    verification_hash text,

    issued_date date,

    uploaded_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240020_audit_trigger.sql
-- ------------------------------------------------------------
create or replace function audit_changes()
returns trigger
language plpgsql
as $$
begin

insert into audit_logs
(
table_name,
record_id,
action,
old_data,
new_data,
performed_by
)
values
(
TG_TABLE_NAME,
coalesce(new.id::text,old.id::text),
TG_OP,
to_jsonb(old),
to_jsonb(new),
auth.uid()
);

return coalesce(new,old);

end;
$$;

create trigger students_audit
after insert or update or delete
on students
for each row
execute function audit_changes();

create trigger schools_audit
after insert or update or delete
on schools
for each row
execute function audit_changes();

-- ------------------------------------------------------------
-- 202606240021_create_verification_api_table.sql
-- ------------------------------------------------------------
create table if not exists public_verifications (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    public_token text unique not null,

    enabled boolean default true,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240022_create_role_hierarchy.sql
-- ------------------------------------------------------------
alter table profiles
drop constraint if exists profiles_role_check;

alter table profiles
add constraint profiles_role_check
check (
role in (
'super_admin',
'government_admin',
'regional_admin',
'district_admin',
'school_admin',
'teacher',
'student',
'auditor'
)
);

-- ------------------------------------------------------------
-- 202606240023_rls_profiles.sql
-- ------------------------------------------------------------
alter table profiles enable row level security;

drop policy if exists profiles_select_self on profiles;

create policy profiles_select_self
on profiles
for select
using (
    auth.uid() = id
);

create policy super_admin_profiles_all
on profiles
for all
using (
    public.is_super_admin()
);

-- ------------------------------------------------------------
-- 202606240024_rls_students.sql
-- ------------------------------------------------------------
alter table students enable row level security;
create policy students_super_admin_all
on students
for all
using (
    public.is_super_admin()
);
create policy students_super_admin_all
on students
for all
using (
    public.is_super_admin()
);

-- ------------------------------------------------------------
-- 202606240025_regional_access_function.sql
-- ------------------------------------------------------------
create or replace function public.user_region()
returns uuid
language sql
stable
as $$
select region_id
from profiles
where id = auth.uid()
limit 1;
$$;

-- ------------------------------------------------------------
-- 202606240026_regional_student_policy.sql
-- ------------------------------------------------------------
create policy regional_admin_students
on students
for select
using (

    exists (

        select 1
        from profiles p

        where p.id = auth.uid()

        and p.role = 'regional_admin'

        and p.region_id = students.current_region_id

    )

);

-- ------------------------------------------------------------
-- 202606240027_district_access.sql
-- ------------------------------------------------------------
alter table profiles
add column if not exists district_id uuid;
create policy district_admin_students
on students
for select
using (

exists (

select 1
from profiles p

where p.id = auth.uid()

and p.role = 'district_admin'

and p.district_id = students.current_district_id

)

);

-- ------------------------------------------------------------
-- 202606240028_school_access.sql
-- ------------------------------------------------------------
alter table profiles
add column if not exists school_id uuid;
create policy school_admin_students
on students
for all
using (

exists (

select 1
from profiles p

where p.id = auth.uid()

and p.role = 'school_admin'

and p.school_id = students.current_school_id

)

);

-- ------------------------------------------------------------
-- 202606240029_create_notifications.sql
-- ------------------------------------------------------------
create table notifications (

    id uuid primary key default gen_random_uuid(),

    recipient_id uuid,

    title text,

    message text,

    is_read boolean default false,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240030_create_system_settings.sql
-- ------------------------------------------------------------
create table system_settings (

    id uuid primary key default gen_random_uuid(),

    setting_key text unique not null,

    setting_value jsonb,

    updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240031_create_student_status_history.sql
-- ------------------------------------------------------------
create table student_status_history (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    old_status text,

    new_status text,

    changed_by uuid,

    remarks text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240032_create_certificate_registry.sql
-- ------------------------------------------------------------
create table certificate_registry (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    certificate_type text,

    certificate_number text unique,

    issuing_authority text,

    issue_date date,

    verification_hash text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240033_create_necta_results.sql
-- ------------------------------------------------------------
create table necta_results (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    exam_type text,

    exam_year integer,

    index_number text,

    division text,

    points integer,

    raw_data jsonb,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240034_create_api_keys.sql
-- ------------------------------------------------------------
create table api_keys (

    id uuid primary key default gen_random_uuid(),

    system_name text,

    api_key_hash text,

    active boolean default true,

    last_used timestamptz,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240035_create_data_retention.sql
-- ------------------------------------------------------------
create table data_retention_logs (

    id uuid primary key default gen_random_uuid(),

    table_name text,

    archived_records integer,

    archived_at timestamptz default now(),

    archived_by uuid
);

-- ------------------------------------------------------------
-- 202606240036_indexes_phase2.sql
-- ------------------------------------------------------------
create index idx_students_name
on students(first_name,last_name);

create index idx_students_dob
on students(date_of_birth);

create index idx_student_current_school
on students(current_school_id);

create index idx_student_current_region
on students(current_region_id);

create index idx_student_current_district
on students(current_district_id);

create index idx_certificate_number
on certificate_registry(certificate_number);

create index idx_necta_index
on necta_results(index_number);

-- ------------------------------------------------------------
-- 202606240037_seed_regions.sql
-- ------------------------------------------------------------
insert into regions (region_code, region_name) values
('01','Arusha'),
('02','Dar es Salaam'),
('03','Dodoma'),
('04','Geita'),
('05','Iringa'),
('06','Kagera'),
('07','Katavi'),
('08','Kigoma'),
('09','Kilimanjaro'),
('10','Lindi'),
('11','Manyara'),
('12','Mara'),
('13','Mbeya'),
('14','Morogoro'),
('15','Mtwara'),
('16','Mwanza'),
('17','Njombe'),
('18','Pwani'),
('19','Rukwa'),
('20','Ruvuma'),
('21','Shinyanga'),
('22','Simiyu'),
('23','Singida'),
('24','Songwe'),
('25','Tabora'),
('26','Tanga'),
('27','Unguja North'),
('28','Unguja South'),
('29','Pemba North'),
('30','Pemba South')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240038_create_school_types.sql
-- ------------------------------------------------------------
create table school_types (

    id uuid primary key default gen_random_uuid(),

    type_code text unique not null,

    type_name text not null,

    created_at timestamptz default now()
);

insert into school_types(type_code,type_name)
values
('PRE','Pre Primary'),
('PRI','Primary School'),
('SEC','Secondary School'),
('ADV','Advanced Level'),
('VTC','Vocational Training'),
('COL','College'),
('UNI','University')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240039_upgrade_school_registry.sql
-- ------------------------------------------------------------
alter table schools
add column if not exists school_type_id uuid references school_types(id);

alter table schools
add column if not exists registration_number text;

alter table schools
add column if not exists ownership_type text;

alter table schools
add column if not exists emis_code text;

alter table schools
add column if not exists principal_name text;

alter table schools
add column if not exists principal_phone text;

alter table schools
add column if not exists principal_email text;

-- ------------------------------------------------------------
-- 202606240040_create_academic_years.sql
-- ------------------------------------------------------------
create table academic_years (

    id uuid primary key default gen_random_uuid(),

    year_code text unique not null,

    start_date date,

    end_date date,

    active boolean default false,

    created_at timestamptz default now()
);

insert into academic_years
(
year_code,
start_date,
end_date,
active
)
values
(
'2026',
'2026-01-01',
'2026-12-31',
true
);

-- ------------------------------------------------------------
-- 202606240041_create_grade_levels.sql
-- ------------------------------------------------------------
create table grade_levels (

    id uuid primary key default gen_random_uuid(),

    grade_code text unique,

    grade_name text,

    level_order integer
);

insert into grade_levels
(
grade_code,
grade_name,
level_order
)
values
('PP1','Pre Primary 1',1),
('PP2','Pre Primary 2',2),
('STD1','Standard 1',3),
('STD2','Standard 2',4),
('STD3','Standard 3',5),
('STD4','Standard 4',6),
('STD5','Standard 5',7),
('STD6','Standard 6',8),
('STD7','Standard 7',9),
('F1','Form 1',10),
('F2','Form 2',11),
('F3','Form 3',12),
('F4','Form 4',13),
('F5','Form 5',14),
('F6','Form 6',15);

-- ------------------------------------------------------------
-- 202606240042_create_student_enrollment.sql
-- ------------------------------------------------------------
create table student_enrollments (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    school_id uuid not null references schools(id),

    academic_year_id uuid references academic_years(id),

    grade_level_id uuid references grade_levels(id),

    enrollment_date date,

    enrollment_status text default 'active',

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240043_create_guardians.sql
-- ------------------------------------------------------------
create table guardians (

    id uuid primary key default gen_random_uuid(),

    guardian_code text unique,

    full_name text not null,

    relationship_type text,

    phone text,

    email text,

    occupation text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240044_create_student_guardians.sql
-- ------------------------------------------------------------
create table student_guardians (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    guardian_id uuid references guardians(id),

    is_primary boolean default false
);

-- ------------------------------------------------------------
-- 202606240045_create_verification_tokens.sql
-- ------------------------------------------------------------
create table verification_tokens (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    token text unique not null,

    expires_at timestamptz,

    active boolean default true,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240046_create_system_audit_views.sql
-- ------------------------------------------------------------
create view vw_student_summary as

select

s.id,
s.tsid,
s.first_name,
s.last_name,
s.student_status,
sc.school_name,
r.region_name

from students s

left join schools sc
on sc.id = s.current_school_id

left join regions r
on r.id = s.current_region_id;

-- ------------------------------------------------------------
-- 202606240047_create_dashboard_views.sql
-- ------------------------------------------------------------
create view vw_dashboard_metrics as

select

count(*) as total_students,

count(*) filter (
where student_status='active'
) as active_students,

count(*) filter (
where student_status='graduated'
) as graduated_students

from students;

-- ------------------------------------------------------------
-- 202606240048_seed_system_settings.sql
-- ------------------------------------------------------------
insert into system_settings
(
setting_key,
setting_value
)
values
(
'country_config',
'{
"country":"Tanzania",
"currency":"TZS",
"timezone":"Africa/Dar_es_Salaam",
"tsid_version":"2.0"
}'::jsonb
)
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240049_create_permissions.sql
-- ------------------------------------------------------------
create table permissions (

    id uuid primary key default gen_random_uuid(),

    permission_code text unique not null,

    permission_name text not null,

    description text,

    created_at timestamptz default now()
);

insert into permissions
(permission_code, permission_name)
values
('student.read','Read Students'),
('student.write','Manage Students'),
('school.read','Read Schools'),
('school.write','Manage Schools'),
('verification.read','Verify TSID'),
('audit.read','View Audit Logs'),
('system.admin','System Administration')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240050_create_role_permissions.sql
-- ------------------------------------------------------------
create table role_permissions (

    id uuid primary key default gen_random_uuid(),

    role_name text not null,

    permission_id uuid not null
    references permissions(id),

    created_at timestamptz default now()
);

-- ============================================================================
-- TSID: EXTENDED TABLES & INTEGRATIONS (migrations 0051-0100)
-- Stats, verification, encryption, API, stubs (069-090), sessions
-- Merged files: 50
-- ============================================================================

-- ------------------------------------------------------------
-- 202606240051_create_user_sessions.sql
-- ------------------------------------------------------------
create table user_sessions (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    login_time timestamptz default now(),

    logout_time timestamptz,

    ip_address inet,

    device_info text,

    location text,

    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240052_create_mfa_support.sql
-- ------------------------------------------------------------
create table user_mfa (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    secret_key text not null,

    backup_codes jsonb,

    enabled boolean default false,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240053_create_verification_logs.sql
-- ------------------------------------------------------------
create table verification_logs (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    verified_by text,

    source_ip inet,

    verification_method text,

    success boolean,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240054_create_public_verification_view.sql
-- ------------------------------------------------------------
create view public_student_verification as

select

s.tsid,
s.first_name,
s.last_name,
s.student_status,
sc.school_name

from students s

left join schools sc
on sc.id = s.current_school_id;

-- ------------------------------------------------------------
-- 202606240055_create_qr_codes.sql
-- ------------------------------------------------------------
create table qr_codes (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    qr_token text unique not null,

    active boolean default true,

    generated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240056_create_student_statistics.sql
-- ------------------------------------------------------------
create materialized view mv_student_statistics as

select

current_region_id,

count(*) total_students,

count(*) filter (
where student_status='active'
) active_students

from students

group by current_region_id;

-- ------------------------------------------------------------
-- 202606240057_create_school_statistics.sql
-- ------------------------------------------------------------
create materialized view mv_school_statistics as

select

current_school_id,

count(*) total_students

from students

group by current_school_id;

-- ------------------------------------------------------------
-- 202606240058_create_region_statistics.sql
-- ------------------------------------------------------------
create materialized view mv_region_statistics as

select

r.region_name,

count(s.id) total_students

from regions r

left join students s
on s.current_region_id = r.id

group by r.region_name;

-- ------------------------------------------------------------
-- 202606240059_create_necta_integration.sql
-- ------------------------------------------------------------
create table necta_sync_queue (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    exam_year integer,

    status text default 'pending',

    response jsonb,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240060_create_nida_reference.sql
-- ------------------------------------------------------------
create table nida_references (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    nida_reference_id text,

    verification_status text,

    last_verified timestamptz
);

-- ------------------------------------------------------------
-- 202606240061_create_heslb_records.sql
-- ------------------------------------------------------------
create table heslb_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid references students(id),

    application_year integer,

    allocation_amount numeric,

    status text,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240062_create_api_audit.sql
-- ------------------------------------------------------------
create table api_audit_logs (

    id uuid primary key default gen_random_uuid(),

    endpoint text,

    method text,

    requester text,

    response_code integer,

    response_time_ms integer,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240063_create_security_events.sql
-- ------------------------------------------------------------
create table security_events (

    id uuid primary key default gen_random_uuid(),

    event_type text,

    severity text,

    description text,

    user_id uuid,

    ip_address inet,

    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240064_create_backup_registry.sql
-- ------------------------------------------------------------
create table backup_registry (

    id uuid primary key default gen_random_uuid(),

    backup_name text,

    storage_location text,

    backup_size bigint,

    backup_date timestamptz default now(),

    status text
);

-- ------------------------------------------------------------
-- 202606240065_create_health_monitoring.sql
-- ------------------------------------------------------------
create table health_monitoring (

    id uuid primary key default gen_random_uuid(),

    service_name text,

    service_status text,

    response_time_ms integer,

    checked_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240066_create_education_history.sql
-- ------------------------------------------------------------
create table education_history (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    school_id uuid references schools(id),

    academic_year text,

    grade_level text,

    enrollment_date date,

    completion_date date,

    status text,

    remarks text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240067_create_student_academic_records.sql
-- ------------------------------------------------------------
create table student_academic_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null references students(id),

    academic_year text,

    average_score numeric,

    grade text,

    remarks text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240068_create_subjects.sql
-- ------------------------------------------------------------
create table subjects (

    id uuid primary key default gen_random_uuid(),

    subject_code text unique,

    subject_name text not null,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240069_create_exam_types.sql
-- ------------------------------------------------------------
-- Exam types (stub - to be implemented)
create table if not exists exam_types (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    active boolean default true,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240070_create_exam_results.sql
-- ------------------------------------------------------------
-- Exam results (stub - to be implemented)
create table if not exists exam_results (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references students(id) on delete cascade,
    exam_type_id uuid references exam_types(id),
    subject_id uuid references subjects(id),
    score numeric(5,2),
    grade text,
    academic_year text,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240071_create_digital_certificates.sql
-- ------------------------------------------------------------
-- Digital certificates (stub - to be implemented)
create table if not exists digital_certificates (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references students(id) on delete cascade,
    certificate_type text not null,
    issued_at timestamptz default now(),
    certificate_hash text unique,
    status text default 'active',
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240072_create_certificate_signatures.sql
-- ------------------------------------------------------------
-- Certificate signatures (stub - to be implemented)
create table if not exists certificate_signatures (
    id uuid primary key default gen_random_uuid(),
    certificate_id uuid references digital_certificates(id) on delete cascade,
    signer_name text not null,
    signer_role text,
    signature_data text,
    signed_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240073_create_certificate_verification_logs.sql
-- ------------------------------------------------------------
-- Certificate verification logs (stub - to be implemented)
create table if not exists certificate_verification_logs (
    id uuid primary key default gen_random_uuid(),
    certificate_id uuid references digital_certificates(id),
    verified_by text,
    verified_at timestamptz default now(),
    result text,
    ip_address text
);

-- ------------------------------------------------------------
-- 202606240074_create_biometrics_registry.sql
-- ------------------------------------------------------------
-- Biometrics registry (stub - to be implemented)
create table if not exists biometrics_registry (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references students(id) on delete cascade,
    biometric_type text not null,
    biometric_hash text unique,
    enrolled_at timestamptz default now(),
    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240075_create_biometric_verifications.sql
-- ------------------------------------------------------------
-- Biometric verifications (stub - to be implemented)
create table if not exists biometric_verifications (
    id uuid primary key default gen_random_uuid(),
    biometric_id uuid references biometrics_registry(id),
    verified_at timestamptz default now(),
    result text,
    confidence_score numeric(5,4)
);

-- ------------------------------------------------------------
-- 202606240076_create_school_registry_imports.sql
-- ------------------------------------------------------------
-- School registry imports (stub - to be implemented)
create table if not exists school_registry_imports (
    id uuid primary key default gen_random_uuid(),
    filename text,
    imported_by uuid,
    record_count int default 0,
    status text default 'pending',
    errors jsonb,
    imported_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240077_create_ward_registry_imports.sql
-- ------------------------------------------------------------
-- Ward registry imports (stub - to be implemented)
create table if not exists ward_registry_imports (
    id uuid primary key default gen_random_uuid(),
    filename text,
    imported_by uuid,
    record_count int default 0,
    status text default 'pending',
    errors jsonb,
    imported_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240078_create_data_warehouse_students.sql
-- ------------------------------------------------------------
-- Data warehouse students (stub - to be implemented)
create table if not exists data_warehouse_students (
    id uuid primary key default gen_random_uuid(),
    student_id uuid,
    snapshot_date date,
    snapshot_data jsonb,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240079_create_data_warehouse_schools.sql
-- ------------------------------------------------------------
-- Data warehouse schools (stub - to be implemented)
create table if not exists data_warehouse_schools (
    id uuid primary key default gen_random_uuid(),
    school_id uuid,
    snapshot_date date,
    snapshot_data jsonb,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240080_create_data_warehouse_regions.sql
-- ------------------------------------------------------------
-- Data warehouse regions (stub - to be implemented)
create table if not exists data_warehouse_regions (
    id uuid primary key default gen_random_uuid(),
    region_id uuid,
    snapshot_date date,
    snapshot_data jsonb,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240081_create_public_verification_api.sql
-- ------------------------------------------------------------
-- Public verification API table (stub - to be implemented)
create table if not exists public_verification_requests (
    id uuid primary key default gen_random_uuid(),
    tsid text,
    requested_at timestamptz default now(),
    ip_address text,
    result jsonb
);

-- ------------------------------------------------------------
-- 202606240082_create_edge_function_logs.sql
-- ------------------------------------------------------------
-- Edge function logs (stub - to be implemented)
create table if not exists edge_function_logs (
    id uuid primary key default gen_random_uuid(),
    function_name text not null,
    invoked_at timestamptz default now(),
    duration_ms int,
    status text,
    error text
);

-- ------------------------------------------------------------
-- 202606240083_create_disaster_recovery_registry.sql
-- ------------------------------------------------------------
-- Disaster recovery registry (stub - to be implemented)
create table if not exists disaster_recovery_registry (
    id uuid primary key default gen_random_uuid(),
    backup_name text not null,
    backup_type text,
    backup_location text,
    created_at timestamptz default now(),
    verified_at timestamptz,
    status text default 'pending'
);

-- ------------------------------------------------------------
-- 202606240084_create_archive_registry.sql
-- ------------------------------------------------------------
-- Archive registry (stub - to be implemented)
create table if not exists archive_registry (
    id uuid primary key default gen_random_uuid(),
    entity_type text not null,
    entity_id uuid,
    archived_at timestamptz default now(),
    archived_by uuid,
    reason text
);

-- ------------------------------------------------------------
-- 202606240085_create_system_metrics.sql
-- ------------------------------------------------------------
-- System metrics (stub - to be implemented)
create table if not exists system_metrics (
    id uuid primary key default gen_random_uuid(),
    metric_name text not null,
    metric_value numeric,
    recorded_at timestamptz default now(),
    tags jsonb
);

-- ------------------------------------------------------------
-- 202606240086_create_performance_indexes.sql
-- ------------------------------------------------------------
-- Performance indexes phase 3 (stub - to be implemented)
-- Placeholder: add additional indexes as needed
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240087_create_partitioning_functions.sql
-- ------------------------------------------------------------
-- Partitioning functions (stub - to be implemented)
-- Placeholder: add table partitioning as data grows
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240088_create_retention_policies.sql
-- ------------------------------------------------------------
-- Retention policies (stub - to be implemented)
-- Placeholder: data retention / archival rules
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240089_create_national_analytics_views.sql
-- ------------------------------------------------------------
-- National analytics views (stub - to be implemented)
-- Placeholder: national-level reporting views
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240090_create_production_readiness.sql
-- ------------------------------------------------------------
-- Production readiness checks (stub - to be implemented)
-- Placeholder: final production readiness steps
select 1; -- no-op placeholder

-- ------------------------------------------------------------
-- 202606240091_create_encryption_functions.sql
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 202606240092_create_pii_encryption.sql
-- ------------------------------------------------------------
create table pii_encryption_keys (
    id uuid primary key default gen_random_uuid(),
    key_name text unique,
    active boolean default true,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240093_create_national_audit_ledger.sql
-- ------------------------------------------------------------
create table national_audit_ledger (
    id bigint generated always as identity primary key,
    event_type text,
    event_data jsonb,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240094_create_audit_immutability.sql
-- ------------------------------------------------------------
alter table national_audit_ledger
replica identity full;

-- ------------------------------------------------------------
-- 202606240095_create_search_index_registry.sql
-- ------------------------------------------------------------
create table search_index_registry (
    id uuid primary key default gen_random_uuid(),
    index_name text,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240096_create_global_search.sql
-- ------------------------------------------------------------
create materialized view mv_global_search as
select tsid, first_name, last_name
from students;

-- ------------------------------------------------------------
-- 202606240097_create_api_rate_limits.sql
-- ------------------------------------------------------------
create table api_rate_limits (
    id uuid primary key default gen_random_uuid(),
    endpoint text,
    requests_per_minute integer
);

-- ------------------------------------------------------------
-- 202606240098_create_api_tokens.sql
-- ------------------------------------------------------------
create table api_tokens (
    id uuid primary key default gen_random_uuid(),
    token_hash text,
    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240099_create_service_accounts.sql
-- ------------------------------------------------------------
create table service_accounts (
    id uuid primary key default gen_random_uuid(),
    account_name text unique,
    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240100_create_environment_registry.sql
-- ------------------------------------------------------------
create table environment_registry (
    id uuid primary key default gen_random_uuid(),
    environment_name text unique
);

-- ============================================================================
-- TSID: PLATFORM FEATURES & ANALYTICS (migrations 0101-0150)
-- Notifications, jobs, sync, OAuth, webhooks, reports, dashboards
-- Merged files: 50
-- ============================================================================

-- ------------------------------------------------------------
-- 202606240101_create_dev_environment.sql
-- ------------------------------------------------------------
insert into environment_registry(environment_name)
values ('development')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240102_create_staging_environment.sql
-- ------------------------------------------------------------
insert into environment_registry(environment_name)
values ('staging')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240103_create_production_environment.sql
-- ------------------------------------------------------------
insert into environment_registry(environment_name)
values ('production')
on conflict do nothing;

-- ------------------------------------------------------------
-- 202606240104_create_edge_functions_registry.sql
-- ------------------------------------------------------------
create table edge_functions_registry (
    id uuid primary key default gen_random_uuid(),
    function_name text unique
);

-- ------------------------------------------------------------
-- 202606240105_create_job_scheduler.sql
-- ------------------------------------------------------------
create table scheduled_jobs (
    id uuid primary key default gen_random_uuid(),
    job_name text,
    cron_expression text
);

-- ------------------------------------------------------------
-- 202606240106_create_background_tasks.sql
-- ------------------------------------------------------------
create table background_tasks (
    id uuid primary key default gen_random_uuid(),
    task_name text,
    status text
);

-- ------------------------------------------------------------
-- 202606240107_create_siem_integrations.sql
-- ------------------------------------------------------------
create table siem_integrations (
    id uuid primary key default gen_random_uuid(),
    provider_name text,
    active boolean default true
);

-- ------------------------------------------------------------
-- 202606240108_create_security_alerts.sql
-- ------------------------------------------------------------
create table security_alerts (
    id uuid primary key default gen_random_uuid(),
    severity text,
    message text,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240109_create_incident_management.sql
-- ------------------------------------------------------------
create table incidents (
    id uuid primary key default gen_random_uuid(),
    title text,
    status text
);

-- ------------------------------------------------------------
-- 202606240110_create_partitioned_audit_logs.sql
-- ------------------------------------------------------------
create table partitioned_audit_logs (
    id bigint generated always as identity,
    created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 202606240111_create_student_search_indexes.sql
-- ------------------------------------------------------------
create index idx_student_name_search
on students(first_name,last_name);

-- ------------------------------------------------------------
-- 202606240112_create_certificate_indexes.sql
-- ------------------------------------------------------------
create index idx_certificate_lookup
on digital_certificates(certificate_number);

-- ------------------------------------------------------------
-- 202606240113_create_national_statistics.sql
-- ------------------------------------------------------------
create materialized view mv_national_statistics as
select count(*) total_students
from students;

-- ------------------------------------------------------------
-- 202606240114_create_dashboard_cache.sql
-- ------------------------------------------------------------
create table dashboard_cache (
    cache_key text primary key,
    cache_data jsonb
);

-- ------------------------------------------------------------
-- 202606240115_create_data_archival.sql
-- ------------------------------------------------------------
create table archived_students (
    like students including all
);

-- ------------------------------------------------------------
-- 202606240116_create_disaster_recovery_tests.sql
-- ------------------------------------------------------------
create table disaster_recovery_tests (
    id uuid primary key default gen_random_uuid(),
    test_date timestamptz
);

-- ------------------------------------------------------------
-- 202606240117_create_performance_monitoring.sql
-- ------------------------------------------------------------
create table performance_monitoring (
    id uuid primary key default gen_random_uuid(),
    metric_name text,
    metric_value numeric
);

-- ------------------------------------------------------------
-- 202606240118_create_system_health_checks.sql
-- ------------------------------------------------------------
create table system_health_checks (
    id uuid primary key default gen_random_uuid(),
    service_name text,
    status text
);

-- ------------------------------------------------------------
-- 202606240119_create_release_registry.sql
-- ------------------------------------------------------------
create table release_registry (
    id uuid primary key default gen_random_uuid(),
    version text
);

-- ------------------------------------------------------------
-- 202606240120_create_enterprise_readiness.sql
-- ------------------------------------------------------------
create table enterprise_readiness (
    id uuid primary key default gen_random_uuid(),
    readiness_area text,
    status text
);

-- ------------------------------------------------------------
-- 202606240121_create_notification_engine.sql
-- ------------------------------------------------------------
create table notification_engine (

    id uuid primary key default gen_random_uuid(),

    notification_type text not null,

    channel text not null,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240122_create_email_queue.sql
-- ------------------------------------------------------------
create table email_queue (

    id uuid primary key default gen_random_uuid(),

    recipient text not null,

    subject text,

    body text,

    status text default 'pending',

    retries integer default 0,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240123_create_sms_queue.sql
-- ------------------------------------------------------------
create table sms_queue (

    id uuid primary key default gen_random_uuid(),

    phone_number text not null,

    message text not null,

    status text default 'pending',

    retries integer default 0,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240124_create_push_notifications.sql
-- ------------------------------------------------------------
create table push_notifications (

    id uuid primary key default gen_random_uuid(),

    user_id uuid,

    title text,

    body text,

    status text default 'pending',

    sent_at timestamptz,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240125_create_bulk_import_jobs.sql
-- ------------------------------------------------------------
create table bulk_import_jobs (

    id uuid primary key default gen_random_uuid(),

    file_name text,

    file_size bigint,

    records_count integer,

    successful_records integer default 0,

    failed_records integer default 0,

    status text,

    started_at timestamptz,

    completed_at timestamptz

);

-- ------------------------------------------------------------
-- 202606240126_create_export_jobs.sql
-- ------------------------------------------------------------
create table export_jobs (

    id uuid primary key default gen_random_uuid(),

    export_type text,

    file_name text,

    file_url text,

    status text,

    created_by uuid,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240127_create_job_history.sql
-- ------------------------------------------------------------
create table job_history (

    id uuid primary key default gen_random_uuid(),

    job_name text,

    execution_status text,

    execution_log text,

    started_at timestamptz,

    ended_at timestamptz

);

-- ------------------------------------------------------------
-- 202606240128_create_sync_registry.sql
-- ------------------------------------------------------------
create table sync_registry (

    id uuid primary key default gen_random_uuid(),

    system_name text,

    sync_type text,

    sync_status text,

    last_sync timestamptz,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240129_create_sync_failures.sql
-- ------------------------------------------------------------
create table sync_failures (

    id uuid primary key default gen_random_uuid(),

    sync_id uuid,

    system_name text,

    error_message text,

    stack_trace text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240130_create_external_systems.sql
-- ------------------------------------------------------------
create table external_systems (

    id uuid primary key default gen_random_uuid(),

    system_name text not null,

    api_endpoint text,

    auth_type text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240131_create_api_consumers.sql
-- ------------------------------------------------------------
create table api_consumers (

    id uuid primary key default gen_random_uuid(),

    consumer_name text not null,

    consumer_type text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240132_create_api_scopes.sql
-- ------------------------------------------------------------
create table api_scopes (

    id uuid primary key default gen_random_uuid(),

    scope_name text unique,

    description text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240133_create_oauth_clients.sql
-- ------------------------------------------------------------
create table oauth_clients (

    id uuid primary key default gen_random_uuid(),

    client_name text,

    client_id text unique,

    client_secret text,

    redirect_uri text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240134_create_webhooks.sql
-- ------------------------------------------------------------
create table webhooks (

    id uuid primary key default gen_random_uuid(),

    webhook_name text,

    target_url text,

    secret_key text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240135_create_webhook_logs.sql
-- ------------------------------------------------------------
create table webhook_logs (

    id uuid primary key default gen_random_uuid(),

    webhook_id uuid,

    payload jsonb,

    response_code integer,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240136_create_public_api_usage.sql
-- ------------------------------------------------------------
create table public_api_usage (

    id uuid primary key default gen_random_uuid(),

    endpoint text,

    requester_ip inet,

    response_code integer,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240137_create_student_timeline.sql
-- ------------------------------------------------------------
create table student_timeline (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    event_type text,

    event_description text,

    event_date timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240138_create_activity_stream.sql
-- ------------------------------------------------------------
create table activity_stream (

    id uuid primary key default gen_random_uuid(),

    user_id uuid,

    activity_type text,

    activity_data jsonb,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240139_create_report_templates.sql
-- ------------------------------------------------------------
create table report_templates (

    id uuid primary key default gen_random_uuid(),

    template_name text,

    template_definition jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240140_create_generated_reports.sql
-- ------------------------------------------------------------
create table generated_reports (

    id uuid primary key default gen_random_uuid(),

    report_name text,

    report_url text,

    generated_by uuid,

    generated_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240141_create_report_exports.sql
-- ------------------------------------------------------------
create table report_exports (

    id uuid primary key default gen_random_uuid(),

    report_id uuid,

    export_format text,

    export_url text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240142_create_dashboard_widgets.sql
-- ------------------------------------------------------------
create table dashboard_widgets (

    id uuid primary key default gen_random_uuid(),

    widget_name text,

    widget_type text,

    widget_config jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240143_create_dashboard_layouts.sql
-- ------------------------------------------------------------
create table dashboard_layouts (

    id uuid primary key default gen_random_uuid(),

    layout_name text,

    layout_definition jsonb,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240144_create_data_quality_rules.sql
-- ------------------------------------------------------------
create table data_quality_rules (

    id uuid primary key default gen_random_uuid(),

    rule_name text,

    rule_description text,

    validation_expression text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240145_create_duplicate_detection.sql
-- ------------------------------------------------------------
create table duplicate_detection (

    id uuid primary key default gen_random_uuid(),

    source_record_id uuid,

    duplicate_record_id uuid,

    confidence_score numeric,

    reviewed boolean default false,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240146_create_data_corrections.sql
-- ------------------------------------------------------------
create table data_corrections (

    id uuid primary key default gen_random_uuid(),

    table_name text,

    record_id text,

    old_value jsonb,

    new_value jsonb,

    corrected_by uuid,

    corrected_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240147_create_system_announcements.sql
-- ------------------------------------------------------------
create table system_announcements (

    id uuid primary key default gen_random_uuid(),

    title text,

    message text,

    active boolean default true,

    published_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240148_create_feature_flags.sql
-- ------------------------------------------------------------
create table feature_flags (

    id uuid primary key default gen_random_uuid(),

    feature_name text unique,

    enabled boolean default false,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240149_create_release_notes.sql
-- ------------------------------------------------------------
create table release_notes (

    id uuid primary key default gen_random_uuid(),

    version text,

    notes text,

    release_date timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240150_create_operations_readiness.sql
-- ------------------------------------------------------------
create table operations_readiness (

    id uuid primary key default gen_random_uuid(),

    readiness_area text,

    readiness_status text,

    remarks text,

    checked_at timestamptz default now()

);

-- ============================================================================
-- TSID: ADVANCED MODULES & NATIONAL READINESS (migrations 0151-0200)
-- Education registry, ML/AI predictions, government dashboards, platform
-- Merged files: 50
-- ============================================================================

-- ------------------------------------------------------------
-- 202606240151_create_institutions.sql
-- ------------------------------------------------------------
create table institutions (

    id uuid primary key default gen_random_uuid(),

    institution_code text unique,

    institution_name text not null,

    institution_type text,

    region_id uuid,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240152_create_universities.sql
-- ------------------------------------------------------------
create table universities (

    id uuid primary key default gen_random_uuid(),

    institution_id uuid,

    university_code text unique,

    accreditation_status text,

    established_year integer

);

-- ------------------------------------------------------------
-- 202606240153_create_colleges.sql
-- ------------------------------------------------------------
create table colleges (

    id uuid primary key default gen_random_uuid(),

    institution_id uuid,

    college_code text unique,

    accreditation_status text

);

-- ------------------------------------------------------------
-- 202606240154_create_training_centers.sql
-- ------------------------------------------------------------
create table training_centers (

    id uuid primary key default gen_random_uuid(),

    institution_id uuid,

    center_type text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240155_create_teachers.sql
-- ------------------------------------------------------------
create table teachers (

    id uuid primary key default gen_random_uuid(),

    teacher_number text unique,

    first_name text,

    last_name text,

    gender text,

    phone text,

    email text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240156_create_teacher_qualifications.sql
-- ------------------------------------------------------------
create table teacher_qualifications (

    id uuid primary key default gen_random_uuid(),

    teacher_id uuid,

    qualification_name text,

    institution_name text,

    graduation_year integer

);

-- ------------------------------------------------------------
-- 202606240157_create_teacher_assignments.sql
-- ------------------------------------------------------------
create table teacher_assignments (

    id uuid primary key default gen_random_uuid(),

    teacher_id uuid,

    school_id uuid,

    assigned_date date,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240158_create_courses.sql
-- ------------------------------------------------------------
create table courses (

    id uuid primary key default gen_random_uuid(),

    course_code text unique,

    course_name text,

    credits integer,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240159_create_programs.sql
-- ------------------------------------------------------------
create table programs (

    id uuid primary key default gen_random_uuid(),

    program_code text unique,

    program_name text,

    duration_years integer

);

-- ------------------------------------------------------------
-- 202606240160_create_departments.sql
-- ------------------------------------------------------------
create table departments (

    id uuid primary key default gen_random_uuid(),

    department_code text unique,

    department_name text,

    institution_id uuid

);

-- ------------------------------------------------------------
-- 202606240161_create_student_programs.sql
-- ------------------------------------------------------------
create table student_programs (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    program_id uuid,

    enrollment_date date,

    graduation_date date,

    status text

);

-- ------------------------------------------------------------
-- 202606240162_create_student_course_enrollments.sql
-- ------------------------------------------------------------
create table student_course_enrollments (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    course_id uuid,

    academic_year text,

    status text

);

-- ------------------------------------------------------------
-- 202606240163_create_attendance.sql
-- ------------------------------------------------------------
create table attendance (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    attendance_date date,

    attendance_status text,

    remarks text

);

-- ------------------------------------------------------------
-- 202606240164_create_discipline_records.sql
-- ------------------------------------------------------------
create table discipline_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    incident_type text,

    description text,

    action_taken text,

    incident_date date

);

-- ------------------------------------------------------------
-- 202606240165_create_special_needs.sql
-- ------------------------------------------------------------
create table special_needs (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    need_type text,

    description text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240166_create_scholarships.sql
-- ------------------------------------------------------------
create table scholarships (

    id uuid primary key default gen_random_uuid(),

    scholarship_name text,

    sponsor_name text,

    amount numeric,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240167_create_student_financial_aid.sql
-- ------------------------------------------------------------
create table student_financial_aid (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    scholarship_id uuid,

    amount_awarded numeric,

    award_year integer

);

-- ------------------------------------------------------------
-- 202606240168_create_student_health_records.sql
-- ------------------------------------------------------------
create table student_health_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    blood_group text,

    allergies text,

    medical_notes text

);

-- ------------------------------------------------------------
-- 202606240169_create_vaccination_records.sql
-- ------------------------------------------------------------
create table vaccination_records (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    vaccine_name text,

    vaccination_date date,

    dose_number integer

);

-- ------------------------------------------------------------
-- 202606240170_create_guardian_contacts.sql
-- ------------------------------------------------------------
create table guardian_contacts (

    id uuid primary key default gen_random_uuid(),

    guardian_id uuid,

    phone_number text,

    email text,

    address text

);

-- ------------------------------------------------------------
-- 202606240171_create_emergency_contacts.sql
-- ------------------------------------------------------------
create table emergency_contacts (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    contact_name text,

    relationship text,

    phone_number text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240172_create_boarding_information.sql
-- ------------------------------------------------------------
create table boarding_information (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    hostel_id uuid,

    room_number text,

    check_in_date date,

    check_out_date date

);

-- ------------------------------------------------------------
-- 202606240173_create_hostels.sql
-- ------------------------------------------------------------
create table hostels (

    id uuid primary key default gen_random_uuid(),

    hostel_code text unique,

    hostel_name text,

    capacity integer,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240174_create_transport_registry.sql
-- ------------------------------------------------------------
create table transport_registry (

    id uuid primary key default gen_random_uuid(),

    vehicle_number text,

    route_name text,

    capacity integer,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240175_create_library_registry.sql
-- ------------------------------------------------------------
create table library_registry (

    id uuid primary key default gen_random_uuid(),

    book_code text unique,

    title text,

    author text,

    available_copies integer default 0

);

-- ------------------------------------------------------------
-- 202606240176_create_library_transactions.sql
-- ------------------------------------------------------------
create table library_transactions (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    book_id uuid,

    borrowed_date date,

    returned_date date

);

-- ------------------------------------------------------------
-- 202606240177_create_student_clubs.sql
-- ------------------------------------------------------------
create table student_clubs (

    id uuid primary key default gen_random_uuid(),

    club_name text,

    description text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240178_create_sports_registry.sql
-- ------------------------------------------------------------
create table sports_registry (

    id uuid primary key default gen_random_uuid(),

    sport_name text,

    category text,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240179_create_competitions.sql
-- ------------------------------------------------------------
create table competitions (

    id uuid primary key default gen_random_uuid(),

    competition_name text,

    competition_type text,

    competition_date date

);

-- ------------------------------------------------------------
-- 202606240180_create_education_registry_readiness.sql
-- ------------------------------------------------------------
create table education_registry_readiness (

    id uuid primary key default gen_random_uuid(),

    readiness_area text,

    readiness_status text,

    remarks text,

    checked_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240181_create_data_lake_registry.sql
-- ------------------------------------------------------------
create table data_lake_registry (

    id uuid primary key default gen_random_uuid(),

    dataset_name text,

    storage_location text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240182_create_ml_training_datasets.sql
-- ------------------------------------------------------------
create table ml_training_datasets (

    id uuid primary key default gen_random_uuid(),

    dataset_name text,

    dataset_version text,

    records_count bigint,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240183_create_prediction_models.sql
-- ------------------------------------------------------------
create table prediction_models (

    id uuid primary key default gen_random_uuid(),

    model_name text,

    model_version text,

    model_type text,

    active boolean default true,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240184_create_dropout_predictions.sql
-- ------------------------------------------------------------
create table dropout_predictions (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    risk_score numeric,

    prediction_date timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240185_create_performance_predictions.sql
-- ------------------------------------------------------------
create table performance_predictions (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    predicted_score numeric,

    prediction_date timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240186_create_risk_scoring.sql
-- ------------------------------------------------------------
create table risk_scoring (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    risk_category text,

    risk_score numeric,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240187_create_anomaly_detection.sql
-- ------------------------------------------------------------
create table anomaly_detection (

    id uuid primary key default gen_random_uuid(),

    entity_type text,

    entity_id text,

    anomaly_score numeric,

    detected_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240188_create_fraud_detection.sql
-- ------------------------------------------------------------
create table fraud_detection (

    id uuid primary key default gen_random_uuid(),

    entity_type text,

    entity_id text,

    fraud_score numeric,

    detected_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240189_create_national_kpis.sql
-- ------------------------------------------------------------
create table national_kpis (

    id uuid primary key default gen_random_uuid(),

    kpi_name text,

    kpi_value numeric,

    reporting_period text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240190_create_government_dashboards.sql
-- ------------------------------------------------------------
create table government_dashboards (

    id uuid primary key default gen_random_uuid(),

    dashboard_name text,

    dashboard_config jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240191_create_regional_dashboards.sql
-- ------------------------------------------------------------
create table regional_dashboards (

    id uuid primary key default gen_random_uuid(),

    region_id uuid,

    dashboard_name text,

    dashboard_config jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240192_create_school_dashboards.sql
-- ------------------------------------------------------------
create table school_dashboards (

    id uuid primary key default gen_random_uuid(),

    school_id uuid,

    dashboard_name text,

    dashboard_config jsonb,

    active boolean default true

);

-- ------------------------------------------------------------
-- 202606240193_create_real_time_statistics.sql
-- ------------------------------------------------------------
create table real_time_statistics (

    id uuid primary key default gen_random_uuid(),

    metric_name text,

    metric_value numeric,

    recorded_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240194_create_student_lifecycle_view.sql
-- ------------------------------------------------------------
create view student_lifecycle_view as

select
    s.id,
    s.tsid,
    s.student_status,
    s.created_at
from students s;

-- ------------------------------------------------------------
-- 202606240195_create_certificate_lifecycle_view.sql
-- ------------------------------------------------------------
create view certificate_lifecycle_view as

select
    certificate_number,
    certificate_type,
    issued_at
from digital_certificates;

-- ------------------------------------------------------------
-- 202606240196_create_population_statistics.sql
-- ------------------------------------------------------------
create materialized view population_statistics as

select
    current_region_id,
    count(*) total_students
from students
group by current_region_id;

-- ------------------------------------------------------------
-- 202606240197_create_graduation_statistics.sql
-- ------------------------------------------------------------
create materialized view graduation_statistics as

select
    graduation_date,
    count(*) graduates
from students
where graduation_date is not null
group by graduation_date;

-- ------------------------------------------------------------
-- 202606240198_create_employment_tracking.sql
-- ------------------------------------------------------------
create table employment_tracking (

    id uuid primary key default gen_random_uuid(),

    student_id uuid,

    employer_name text,

    job_title text,

    employment_status text,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240199_create_ai_audit_logs.sql
-- ------------------------------------------------------------
create table ai_audit_logs (

    id uuid primary key default gen_random_uuid(),

    model_name text,

    prediction_type text,

    prediction_result jsonb,

    created_at timestamptz default now()

);

-- ------------------------------------------------------------
-- 202606240200_create_national_platform_readiness.sql
-- ------------------------------------------------------------
create table national_platform_readiness (

    id uuid primary key default gen_random_uuid(),

    readiness_area text,

    readiness_status text,

    remarks text,

    assessed_at timestamptz default now()

);

-- Migration 006: Update password column constraints for PBKDF2 hashing
-- Previously constrained to length=64 (SHA-256 hex). PBKDF2 format is ~80+ chars.
-- Format: $pbkdf2$<iterations>$<base64-salt>$<base64-hash>

-- Drop old SHA-256 length constraints on admin_users
ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_password_hash;

-- Replace with a flexible constraint that accepts both:
--   • Legacy SHA-256 (64-char hex) — for existing rows during migration window
--   • New PBKDF2 format starting with "$pbkdf2$"
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_password_hash
    CHECK (
      length(password) = 64                    -- legacy SHA-256 hex
      OR password LIKE '$pbkdf2$%'             -- new PBKDF2 format
    );

-- Drop old constraint on schools table
ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_password_hash;

ALTER TABLE public.schools
  ADD CONSTRAINT schools_password_hash
    CHECK (
      length(password) = 64
      OR password LIKE '$pbkdf2$%'
    );

-- Also drop constraint on students cred_password (if any exist)
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_password_hash;
-- Migration 007: Seed superadmin account
-- Email: support@tsid.go.tz
-- Auth UID: 58a154bb-1ea0-4875-9cc7-0800704546b3
-- Role: gov (highest portal access — Government/Superadmin)
-- Password: Tsid@2025!Support  (PBKDF2-SHA256, 100k iterations)
-- ⚠️  Change password immediately after first login.

-- 1. Upsert into admin_users (gov role = full system access)
INSERT INTO public.admin_users (
  auth_uid,
  name,
  email,
  role,
  ministry,
  status,
  password
)
VALUES (
  '58a154bb-1ea0-4875-9cc7-0800704546b3',
  'TSID Super Admin',
  'support@tsid.go.tz',
  'gov',
  'Ministry of Education, Science and Technology',
  'active',
  '$pbkdf2$100000$N7CdhA2Fyb3JGzX0xtaNbw==$xYDcxqw+LKoqRzjJ7EcOMOvz2CeJyXfpIltUzXPPF6k='
)
ON CONFLICT (auth_uid) DO UPDATE SET
  name     = EXCLUDED.name,
  email    = EXCLUDED.email,
  role     = EXCLUDED.role,
  ministry = EXCLUDED.ministry,
  status   = EXCLUDED.status,
  password = EXCLUDED.password;

-- 2. Ensure user_roles entry exists for auth middleware
INSERT INTO public.user_roles (user_id, role)
VALUES ('58a154bb-1ea0-4875-9cc7-0800704546b3', 'gov')
ON CONFLICT (user_id) DO UPDATE SET role = 'gov';

-- 3. Log the action
INSERT INTO public.activity_logs (action, message, by_name, by_role, by_ref)
VALUES (
  'superadmin:seed',
  'Superadmin account seeded for support@tsid.go.tz',
  'System Migration',
  'gov',
  '58a154bb-1ea0-4875-9cc7-0800704546b3'
);
