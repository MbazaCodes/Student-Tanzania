
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
