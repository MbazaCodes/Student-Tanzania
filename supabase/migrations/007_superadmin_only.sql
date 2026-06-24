-- ============================================================================
-- TSID: Superadmin seed — safe to run on existing DB
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Ensure enums exist (safe)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('gov','school','student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Ensure admin_users table exists
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid    UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'gov',
  ministry    TEXT,
  region      TEXT,
  phone       TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  password    TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role     TEXT NOT NULL,
  UNIQUE(user_id)
);

-- 4. Ensure activity_logs table exists
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action     TEXT NOT NULL,
  message    TEXT,
  by_name    TEXT,
  by_role    TEXT,
  by_ref     TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Insert superadmin into admin_users
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
  name      = EXCLUDED.name,
  email     = EXCLUDED.email,
  role      = EXCLUDED.role,
  ministry  = EXCLUDED.ministry,
  status    = EXCLUDED.status,
  password  = EXCLUDED.password,
  updated_at = now();

-- 6. Insert into user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES ('58a154bb-1ea0-4875-9cc7-0800704546b3', 'gov')
ON CONFLICT (user_id) DO UPDATE SET role = 'gov';

-- 7. Log it
INSERT INTO public.activity_logs (action, message, by_name, by_role, by_ref)
VALUES (
  'superadmin:seed',
  'Superadmin seeded: support@tsid.go.tz (UID 58a154bb-1ea0-4875-9cc7-0800704546b3)',
  'System',
  'gov',
  '58a154bb-1ea0-4875-9cc7-0800704546b3'
);

-- Done
SELECT 'Superadmin created successfully' AS result,
       email, role, status
FROM   public.admin_users
WHERE  auth_uid = '58a154bb-1ea0-4875-9cc7-0800704546b3';
