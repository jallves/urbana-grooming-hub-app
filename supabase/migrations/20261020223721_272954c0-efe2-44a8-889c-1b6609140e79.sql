GRANT EXECUTE ON FUNCTION public.public_clients_count() TO anon;
GRANT EXECUTE ON FUNCTION public.public_client_names(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.log_admin_activity(text, text, uuid, jsonb, jsonb) TO anon;