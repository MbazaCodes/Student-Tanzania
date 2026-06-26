-- ============================================================================
-- Migration 025: remove the duplicate letter_requests INSERT policy.
-- A second policy ("Users can insert their own letter requests") was created
-- outside our migrations. Multiple INSERT policies are AND-combined for
-- WITH CHECK, which can cause "new row violates row-level security policy".
-- We keep only our canonical "lr insert" policy.
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own letter requests" ON public.letter_requests;

-- Also drop any other likely duplicates from scaffolds, if present
DROP POLICY IF EXISTS "Users can view their own letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Users can update their own letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.letter_requests;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 025 complete — duplicate letter_requests policies removed' AS result;
