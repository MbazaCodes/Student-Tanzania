-- ============================================================================
-- Migration 030: school fee-exemption category
-- Special schools (shule maalum) and schools in hard environments
-- (mazingira magumu) get FREE letter services for ALL their students.
-- ============================================================================

-- category: 'normal' | 'special' (shule maalum) | 'hardship' (mazingira magumu)
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'normal';

-- Convenience flag derived from category (kept in sync at write time by the app).
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS fee_exempt BOOLEAN DEFAULT false;

-- Backfill: existing Special Needs Schools are treated as exempt
UPDATE public.schools SET category = 'special', fee_exempt = true
WHERE type = 'Special Needs School' AND (category IS NULL OR category = 'normal');

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 030 complete — school exempt category added' AS result;
