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
