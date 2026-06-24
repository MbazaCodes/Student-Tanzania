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
