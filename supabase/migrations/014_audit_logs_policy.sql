-- Migration 014: audit_logs RLS policy
-- A DB trigger on schools (and possibly other tables) writes to public.audit_logs.
-- Without an INSERT policy the trigger fails: "new row violates row-level
-- security policy for table audit_logs". This allows authenticated inserts.

DROP POLICY IF EXISTS "audit_logs authenticated insert" ON public.audit_logs;
CREATE POLICY "audit_logs authenticated insert"
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "audit_logs authenticated read" ON public.audit_logs;
CREATE POLICY "audit_logs authenticated read"
ON public.audit_logs FOR SELECT TO authenticated USING (true);

GRANT INSERT, SELECT ON public.audit_logs TO authenticated;

SELECT 'Migration 014 complete — audit_logs writable' AS result;
