-- Migration 019: students get auth accounts (login with TSID + password)
-- Synthetic email <tsid>@students.tsid.go.tz created by create-student Edge Fn.

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_uid UUID;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 019 complete — students.auth_uid added' AS result;
