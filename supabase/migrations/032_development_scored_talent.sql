-- ============================================================================
-- Migration 032: scored remarks + manual comments + student talent
-- Each of the 6 development categories now carries a rating, a score %, and a
-- manual comment (why not 100%, how to improve). Plus lifetime talent tracking.
-- ============================================================================

-- Per-category rating + score + comment.
-- We store a small JSONB per category to keep the schema tidy:
--   { "rating": "Good", "score": 75, "comment": "..." }
ALTER TABLE public.student_development ADD COLUMN IF NOT EXISTS behaviour_detail  JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.student_development ADD COLUMN IF NOT EXISTS exams_detail      JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.student_development ADD COLUMN IF NOT EXISTS attendance_detail JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.student_development ADD COLUMN IF NOT EXISTS social_detail     JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.student_development ADD COLUMN IF NOT EXISTS special_detail    JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.student_development ADD COLUMN IF NOT EXISTS other_detail      JSONB DEFAULT '{}'::jsonb;

-- Talent for THIS record (year/term snapshot of identified/developing talent)
ALTER TABLE public.student_development ADD COLUMN IF NOT EXISTS talent_area    TEXT;   -- e.g. 'Football', 'Science'
ALTER TABLE public.student_development ADD COLUMN IF NOT EXISTS talent_remark  TEXT;   -- how it's being developed

-- Overall / current talent on the student record (their "best off")
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS talent_primary  TEXT;  -- best talent
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS talent_secondary TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS talent_notes    TEXT;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 032 complete — scored remarks + talent added' AS result;
