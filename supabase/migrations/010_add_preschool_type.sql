-- Migration 010: Add Pre-School / Nursery to school_type enum
-- Run in Supabase SQL Editor

ALTER TYPE public.school_type ADD VALUE IF NOT EXISTS 'Pre-School / Nursery' BEFORE 'Primary School';

SELECT 'Done: Pre-School / Nursery added to school_type enum' AS result;
