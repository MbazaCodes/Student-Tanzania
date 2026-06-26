-- ============================================================================
-- Migration 037: Parent / Guardian role
-- A parent has a login (email), can be linked to one or more children (siblings),
-- sees their children read-only, and can submit requests.
-- ============================================================================

-- Link table: parent (admin_users.ref) ↔ student (tsid). Many-to-many capable.
CREATE TABLE IF NOT EXISTS public.parent_children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_ref   TEXT NOT NULL,        -- the parent's ref (their parent id / email handle)
  parent_uid   UUID,                 -- parent's auth uid
  tsid         TEXT NOT NULL,        -- child
  relationship TEXT,                 -- Mother / Father / Guardian ...
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_ref, tsid)
);
CREATE INDEX IF NOT EXISTS idx_pc_parent ON public.parent_children(parent_ref);
CREATE INDEX IF NOT EXISTS idx_pc_parentuid ON public.parent_children(parent_uid);
CREATE INDEX IF NOT EXISTS idx_pc_tsid   ON public.parent_children(tsid);

ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller a parent? returns their parent_ref
CREATE OR REPLACE FUNCTION public.my_parent_ref()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ref FROM public.admin_users
  WHERE auth_uid = auth.uid() AND role = 'parent' LIMIT 1;
$$;

-- Helper: does the caller (parent) own this tsid?
CREATE OR REPLACE FUNCTION public.parent_owns(p_tsid TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_children pc
    WHERE pc.tsid = p_tsid AND pc.parent_ref = public.my_parent_ref()
  );
$$;

-- parent_children RLS: parent sees own links; school/gov see their scope
DROP POLICY IF EXISTS "pc read" ON public.parent_children;
CREATE POLICY "pc read" ON public.parent_children FOR SELECT TO authenticated
USING (
  (public.my_parent_ref() IS NOT NULL AND parent_ref = public.my_parent_ref())
  OR public.my_school_code() IS NOT NULL
  OR public.is_national()
);
DROP POLICY IF EXISTS "pc write" ON public.parent_children;
CREATE POLICY "pc write" ON public.parent_children FOR INSERT TO authenticated
WITH CHECK (public.my_school_code() IS NOT NULL OR public.is_national());
DROP POLICY IF EXISTS "pc delete" ON public.parent_children;
CREATE POLICY "pc delete" ON public.parent_children FOR DELETE TO authenticated
USING (public.my_school_code() IS NOT NULL OR public.is_national());

GRANT SELECT, INSERT, DELETE ON public.parent_children TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_parent_ref() TO authenticated;
GRANT EXECUTE ON FUNCTION public.parent_owns(TEXT) TO authenticated;

-- Let parents READ their children across the relevant tables (add to existing policies)
DROP POLICY IF EXISTS "students parent read" ON public.students;
CREATE POLICY "students parent read" ON public.students FOR SELECT TO authenticated
USING (public.parent_owns(tsid));

DROP POLICY IF EXISTS "dev parent read" ON public.student_development;
CREATE POLICY "dev parent read" ON public.student_development FOR SELECT TO authenticated
USING (public.parent_owns(tsid));

DROP POLICY IF EXISTS "fa parent read" ON public.field_attachments;
CREATE POLICY "fa parent read" ON public.field_attachments FOR SELECT TO authenticated
USING (public.parent_owns(tsid));

DROP POLICY IF EXISTS "lr parent read" ON public.letter_requests;
CREATE POLICY "lr parent read" ON public.letter_requests FOR SELECT TO authenticated
USING (public.parent_owns(tsid));

-- Parents may submit letter requests for their children
DROP POLICY IF EXISTS "lr parent insert" ON public.letter_requests;
CREATE POLICY "lr parent insert" ON public.letter_requests FOR INSERT TO authenticated
WITH CHECK (public.parent_owns(tsid));

NOTIFY pgrst, 'reload schema';
SELECT 'Migration 037 complete — parent/guardian role ready' AS result;
