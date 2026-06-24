
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
