-- Migration 016: ensure all student insert columns exist
-- Fixes "Could not find the 'district' column of 'students' in the schema cache"

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS region          TEXT,
  ADD COLUMN IF NOT EXISTS district        TEXT,
  ADD COLUMN IF NOT EXISTS ward            TEXT,
  ADD COLUMN IF NOT EXISTS school_contact  TEXT,
  ADD COLUMN IF NOT EXISTS nationality     TEXT DEFAULT 'Tanzanian',
  ADD COLUMN IF NOT EXISTS enrollment_date TEXT,
  ADD COLUMN IF NOT EXISTS issue_date      TEXT,
  ADD COLUMN IF NOT EXISTS blood_group     TEXT,
  ADD COLUMN IF NOT EXISTS parent_name     TEXT,
  ADD COLUMN IF NOT EXISTS parent_nida     TEXT,
  ADD COLUMN IF NOT EXISTS relationship    TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone    TEXT,
  ADD COLUMN IF NOT EXISTS cred_username   TEXT,
  ADD COLUMN IF NOT EXISTS cred_password   TEXT,
  ADD COLUMN IF NOT EXISTS remarks         JSONB DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';

SELECT 'Migration 016 complete — students columns ready' AS result;
