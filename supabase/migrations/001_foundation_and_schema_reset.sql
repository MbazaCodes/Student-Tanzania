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

