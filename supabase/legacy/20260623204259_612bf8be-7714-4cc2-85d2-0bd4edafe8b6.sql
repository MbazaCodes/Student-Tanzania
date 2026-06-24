
DROP POLICY IF EXISTS "students public read" ON public.students;
DROP VIEW IF EXISTS public.students_public;

CREATE OR REPLACE FUNCTION public.search_student(_tsid_no TEXT)
RETURNS TABLE(tsid_no TEXT, full_name TEXT, status public.student_status, photo_url TEXT, school_name TEXT, region TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.tsid_no, s.full_name, s.status, s.photo_url, sc.name, sc.region
  FROM public.students s LEFT JOIN public.schools sc ON sc.id = s.school_id
  WHERE s.tsid_no = _tsid_no
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.search_student(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_student(text) TO anon, authenticated;
