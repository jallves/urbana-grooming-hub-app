GRANT SELECT ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

REVOKE INSERT, UPDATE, DELETE ON public.employees FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.staff FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.painel_barbeiros FROM anon;