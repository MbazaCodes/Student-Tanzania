-- ============================================================================
-- Migration 034: national exam / registration index numbers on the student
-- Standard 4, Standard 6/7 (PSLE), Form 2, Form 4 (CSEE), Form 6 (ACSEE),
-- plus college / university / vocational registration numbers.
-- ============================================================================

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_std4    TEXT;  -- Standard 4 (SFNA)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_std6    TEXT;  -- Standard 6
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_std7    TEXT;  -- Standard 7 (PSLE)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_form2   TEXT;  -- Form 2 (FTNA)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_form4   TEXT;  -- Form 4 (CSEE)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_form6   TEXT;  -- Form 6 (ACSEE)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_college   TEXT;  -- College reg no
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_university TEXT; -- University reg no
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS idx_vocational TEXT; -- Vocational (VETA/NACTE) reg no

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 034 complete — exam index numbers added' AS result;
