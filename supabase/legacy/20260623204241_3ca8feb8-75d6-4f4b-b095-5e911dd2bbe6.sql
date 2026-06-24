
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

DROP VIEW IF EXISTS public.students_public;
CREATE VIEW public.students_public WITH (security_invoker = true) AS
SELECT s.tsid_no, s.full_name, s.status, s.photo_url, sc.name AS school_name, sc.region
FROM public.students s LEFT JOIN public.schools sc ON sc.id = s.school_id;
GRANT SELECT ON public.students_public TO anon, authenticated;

-- Need a policy that lets anon SELECT students for the view (security_invoker uses caller perms)
CREATE POLICY "students public read" ON public.students FOR SELECT TO anon USING (true);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_school_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_school_id() TO authenticated;
