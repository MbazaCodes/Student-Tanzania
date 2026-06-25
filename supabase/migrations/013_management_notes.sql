-- Migration 013: notes columns for admins, schools, students + audit
-- Run in Supabase SQL Editor

-- Notes/remarks columns
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.schools     ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.students    ADD COLUMN IF NOT EXISTS notes TEXT;

-- National-only DELETE policy on schools
DROP POLICY IF EXISTS "schools delete national" ON public.schools;
CREATE POLICY "schools delete national"
ON public.schools FOR DELETE TO authenticated
USING (public.is_national());

-- National-only DELETE policy on admin_users (cannot delete self handled in app)
DROP POLICY IF EXISTS "admins delete national" ON public.admin_users;
CREATE POLICY "admins delete national"
ON public.admin_users FOR DELETE TO authenticated
USING (public.is_national());

-- National-only UPDATE on admin_users
DROP POLICY IF EXISTS "admins update national" ON public.admin_users;
CREATE POLICY "admins update national"
ON public.admin_users FOR UPDATE TO authenticated
USING (public.is_national());

SELECT 'Migration 013 complete' AS result;
