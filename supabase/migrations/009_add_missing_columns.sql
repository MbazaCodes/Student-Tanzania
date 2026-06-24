-- Migration 009: Add missing columns to existing tables
-- Safe to run on existing DB — all use IF NOT EXISTS / DO NOTHING patterns

-- Add missing columns to schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS type        TEXT NOT NULL DEFAULT 'Secondary School',
  ADD COLUMN IF NOT EXISTS ward        TEXT,
  ADD COLUMN IF NOT EXISTS address     TEXT,
  ADD COLUMN IF NOT EXISTS cred_username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cred_password TEXT,
  ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS username    TEXT,
  ADD COLUMN IF NOT EXISTS password    TEXT,
  ADD COLUMN IF NOT EXISTS contact     TEXT,
  ADD COLUMN IF NOT EXISTS email       TEXT;

-- Add missing columns to students  
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS tsid            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS fullname        TEXT,
  ADD COLUMN IF NOT EXISTS dob             TEXT,
  ADD COLUMN IF NOT EXISTS gender          TEXT,
  ADD COLUMN IF NOT EXISTS photo           TEXT,
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS level           TEXT,
  ADD COLUMN IF NOT EXISTS nationality     TEXT DEFAULT 'Tanzanian',
  ADD COLUMN IF NOT EXISTS school_code     TEXT,
  ADD COLUMN IF NOT EXISTS school_name     TEXT,
  ADD COLUMN IF NOT EXISTS region          TEXT,
  ADD COLUMN IF NOT EXISTS district        TEXT,
  ADD COLUMN IF NOT EXISTS ward            TEXT,
  ADD COLUMN IF NOT EXISTS blood_group     TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_date TEXT,
  ADD COLUMN IF NOT EXISTS issue_date      TEXT,
  ADD COLUMN IF NOT EXISTS parent_name     TEXT,
  ADD COLUMN IF NOT EXISTS parent_nida     TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone    TEXT,
  ADD COLUMN IF NOT EXISTS relationship    TEXT,
  ADD COLUMN IF NOT EXISTS school_contact  TEXT,
  ADD COLUMN IF NOT EXISTS cred_username   TEXT,
  ADD COLUMN IF NOT EXISTS cred_password   TEXT,
  ADD COLUMN IF NOT EXISTS remarks         TEXT[] DEFAULT '{}';

-- Add missing columns to admin_users
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS ref        TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure activity_logs has all needed columns
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS by_name    TEXT,
  ADD COLUMN IF NOT EXISTS by_role    TEXT,
  ADD COLUMN IF NOT EXISTS by_ref     TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT;

SELECT 'Migration 009 complete — missing columns added' AS result;
