-- Migration 006: Update password column constraints for PBKDF2 hashing
-- Previously constrained to length=64 (SHA-256 hex). PBKDF2 format is ~80+ chars.
-- Format: $pbkdf2$<iterations>$<base64-salt>$<base64-hash>

-- Drop old SHA-256 length constraints on admin_users
ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_password_hash;

-- Replace with a flexible constraint that accepts both:
--   • Legacy SHA-256 (64-char hex) — for existing rows during migration window
--   • New PBKDF2 format starting with "$pbkdf2$"
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_password_hash
    CHECK (
      length(password) = 64                    -- legacy SHA-256 hex
      OR password LIKE '$pbkdf2$%'             -- new PBKDF2 format
    );

-- Drop old constraint on schools table
ALTER TABLE public.schools
  DROP CONSTRAINT IF EXISTS schools_password_hash;

ALTER TABLE public.schools
  ADD CONSTRAINT schools_password_hash
    CHECK (
      length(password) = 64
      OR password LIKE '$pbkdf2$%'
    );

-- Also drop constraint on students cred_password (if any exist)
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_password_hash;
