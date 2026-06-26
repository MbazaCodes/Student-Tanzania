-- ============================================================================
-- Migration 029: extra student detail fields
-- Health, ethnicity, disability (ulemavu) and related demographic details.
-- ============================================================================

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS ethnicity        TEXT;  -- Kabila
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS religion         TEXT;  -- Dini
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS disability       TEXT;  -- Ulemavu (type / 'None')
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS health_condition TEXT;  -- Hali ya afya / chronic conditions
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS allergies        TEXT;  -- Mzio
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS emergency_contact_name  TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS home_address     TEXT;  -- Anuani ya nyumbani

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 029 complete — extra student detail fields added' AS result;
