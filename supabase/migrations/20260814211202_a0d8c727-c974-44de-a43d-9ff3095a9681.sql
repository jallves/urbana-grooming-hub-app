CREATE OR REPLACE FUNCTION public.public_clients_count()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT count(*)::int FROM public.painel_clientes $$;

CREATE OR REPLACE FUNCTION public.public_client_names(p_ids uuid[])
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT c.id, c.nome FROM public.painel_clientes c WHERE c.id = ANY(p_ids) LIMIT 50 $$;

GRANT EXECUTE ON FUNCTION public.public_clients_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_client_names(uuid[]) TO anon, authenticated, service_role;