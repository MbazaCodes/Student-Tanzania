-- ============================================================================
-- Migration 028: letter request payment (flat 2,000 TZS) + receipt distribution
-- Flow: student submits → pays via mobile (simulated) → school sees paid →
--       school approves → student gets letter PDF + receipt.
-- ============================================================================

-- Flat fee for every letter request
ALTER TABLE public.letter_requests ALTER COLUMN fee_type SET DEFAULT 'paid';
ALTER TABLE public.letter_requests ALTER COLUMN amount   SET DEFAULT 2000;

-- Payment fields
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS service_number TEXT;     -- payment/control reference
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS payment_method TEXT;     -- 'mobile' | 'online'
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS payment_ref TEXT;        -- gateway/txn id (mock for now)
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.letter_requests ADD COLUMN IF NOT EXISTS receipt_no TEXT;

-- Backfill existing rows to the flat fee
UPDATE public.letter_requests SET fee_type = 'paid', amount = 2000
WHERE amount IS NULL OR amount = 0;

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 028 complete — letter payment fields added (flat 2000 TZS)' AS result;

-- Student must be able to update their OWN letter row to record payment.
-- The existing "lr update" only allowed school + gov.
DROP POLICY IF EXISTS "lr update" ON public.letter_requests;
CREATE POLICY "lr update" ON public.letter_requests FOR UPDATE TO authenticated
USING (
  (public.my_tsid() IS NOT NULL AND tsid = public.my_tsid())
  OR (public.my_school_code() IS NOT NULL AND school_code = public.my_school_code())
  OR public.is_national()
  OR (public.my_region()   IS NOT NULL AND region   = public.my_region())
  OR (public.my_district() IS NOT NULL AND district = public.my_district())
);

NOTIFY pgrst, 'reload schema';
