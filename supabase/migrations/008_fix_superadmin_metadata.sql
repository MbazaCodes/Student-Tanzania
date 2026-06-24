-- Migration 008: Set role in auth.users app_metadata for superadmin
-- This ensures role lookup works even if admin_users table query fails
-- Run in Supabase SQL Editor

-- Update auth metadata directly on the user
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "gov", "is_superadmin": true}'::jsonb,
    raw_user_meta_data = raw_user_meta_data || '{"role": "gov", "name": "TSID Super Admin"}'::jsonb
WHERE id = '58a154bb-1ea0-4875-9cc7-0800704546b3';

-- Verify
SELECT id, email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE id = '58a154bb-1ea0-4875-9cc7-0800704546b3';
