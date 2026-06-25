-- Migration 023: allow a student to update their OWN record
-- Needed so students can save their own profile photo directly (their own image).
-- Other sensitive fields still flow through the approval workflow in the app.

DROP POLICY IF EXISTS "students self update" ON public.students;
CREATE POLICY "students self update"
ON public.students FOR UPDATE TO authenticated
USING (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
WITH CHECK (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid());

-- Note: the existing "students update scope" policy (gov/region/district/school)
-- remains; RLS policies are OR-combined, so this adds student-self capability
-- without removing the others.

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 023 complete — students can update own record' AS result;
