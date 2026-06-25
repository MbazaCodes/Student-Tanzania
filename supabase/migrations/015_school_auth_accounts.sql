-- Migration 015: link schools to auth accounts
-- Schools now get a real Supabase Auth user (created by create-school Edge Fn)
-- so they can log in via signInWithPassword. Add auth_uid to schools.

ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS auth_uid UUID;

-- The school's admin_users row uses role='school' and ref=school_code.
-- use-current-user resolves schoolCode from admin_users.ref when role='school'.

SELECT 'Migration 015 complete — schools.auth_uid added' AS result;
