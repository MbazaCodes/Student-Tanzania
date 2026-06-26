-- ============================================================================
-- Migration 027: signature + stamp for letter approval
-- School signs (draw on screen or upload) and stamps each approved letter.
-- Stored per-letter so the exact mark used is preserved on the document.
-- Also stored on the school record so it can be reused as a default.
-- ============================================================================

ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS stamp TEXT;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS signed_by TEXT;

-- Reusable defaults on the school record
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS stamp TEXT;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 027 complete — letter signature + stamp columns added' AS result;

-- Allow a school account to update its OWN row (for saving default signature/stamp + logo).
-- The active "schools update scope" policy only covers gov tiers.
DROP POLICY IF EXISTS "schools self update by code" ON public.schools;
CREATE POLICY "schools self update by code"
ON public.schools FOR UPDATE TO authenticated
USING (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
WITH CHECK (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code());

NOTIFY pgrst, 'reload schema';
