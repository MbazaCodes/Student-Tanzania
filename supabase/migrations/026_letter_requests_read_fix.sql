-- ============================================================================
-- Migration 026: fix letter_requests SELECT so students see their own requests
-- and schools see their school's requests.
-- A scaffold policy ("Admins can view all letter requests") replaced our
-- "lr read" and restricted reads to admins only — students/schools saw nothing.
-- ============================================================================

-- Remove the scaffold read/update policies
DROP POLICY IF EXISTS "Admins can view all letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Admins can update all letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Users can view their own letter requests" ON public.letter_requests;

-- Restore our scoped READ policy
DROP POLICY IF EXISTS "lr read" ON public.letter_requests;
CREATE POLICY "lr read" ON public.letter_requests FOR SELECT TO authenticated
USING (
  (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

-- Restore our scoped UPDATE policy (school approves own; gov by scope)
DROP POLICY IF EXISTS "lr update" ON public.letter_requests;
CREATE POLICY "lr update" ON public.letter_requests FOR UPDATE TO authenticated
USING (
  (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 026 complete — students/schools can read their letter requests' AS result;
