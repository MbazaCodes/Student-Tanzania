ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS district   TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID;

CREATE OR REPLACE FUNCTION public.is_national()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users
    WHERE auth_uid = auth.uid() AND role IN ('gov','admin'));
$$;

CREATE OR REPLACE FUNCTION public.my_region()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT region FROM public.admin_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.my_district()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT district FROM public.admin_users WHERE auth_uid = auth.uid() LIMIT 1;
$$;