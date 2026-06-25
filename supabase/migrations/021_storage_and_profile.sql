-- ============================================================================
-- Migration 021: profile images storage bucket + delete-request support
-- ============================================================================

-- Public storage bucket for profile photos (students + schools + admins)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read profile images (public bucket); authenticated can upload/update
DROP POLICY IF EXISTS "profiles read" ON storage.objects;
CREATE POLICY "profiles read" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "profiles upload" ON storage.objects;
CREATE POLICY "profiles upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profiles');

DROP POLICY IF EXISTS "profiles update" ON storage.objects;
CREATE POLICY "profiles update" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "profiles delete" ON storage.objects;
CREATE POLICY "profiles delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'profiles');

-- change_requests already supports a 'delete' intent via a special field
ALTER TABLE public.change_requests
  ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'edit';  -- 'edit' | 'delete'

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 021 complete — profiles bucket + delete requests' AS result;

-- Store school_type on student so level dropdown works during edit
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_type TEXT;

-- School logo / photo column
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS logo TEXT;
