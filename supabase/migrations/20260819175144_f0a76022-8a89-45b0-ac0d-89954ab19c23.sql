-- Recognise trusted server-side calls (edge functions run as service_role).
CREATE OR REPLACE FUNCTION private.is_service_request()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT current_user = 'service_role' OR current_setting('role', true) = 'service_role';
$$;

REVOKE ALL ON FUNCTION private.is_service_request() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.decrease_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT private.is_service_request()
     AND NOT private.is_totem_request()
     AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  UPDATE public.painel_produtos
  SET estoque = GREATEST(0, coalesce(estoque, 0) - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.totem_search_client(p_query text)
RETURNS TABLE(id uuid, nome text, email text, telefone text, whatsapp text, user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT private.is_service_request()
     AND NOT private.is_totem_request()
     AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT pc.id, pc.nome, pc.email, pc.telefone, pc.whatsapp, pc.user_id
  FROM public.painel_clientes pc
  WHERE pc.nome ILIKE '%' || p_query || '%'
     OR pc.email ILIKE '%' || p_query || '%'
     OR pc.telefone ILIKE '%' || p_query || '%'
     OR pc.whatsapp ILIKE '%' || p_query || '%'
     OR regexp_replace(coalesce(pc.telefone, ''), '\D', '', 'g')
        ILIKE '%' || regexp_replace(p_query, '\D', '', 'g') || '%'
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.invalidate_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT private.is_service_request()
     AND auth.uid() IS NULL
     AND NOT private.is_totem_request() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.active_sessions
  SET is_active = false
  WHERE id = p_session_id
    AND (
      private.is_service_request()
      OR private.is_totem_request()
      OR user_id = auth.uid()
      OR public.is_admin_or_higher(auth.uid())
    );

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT private.is_service_request()
     AND auth.uid() IS NULL
     AND NOT private.is_totem_request() THEN
    RETURN false;
  END IF;

  UPDATE public.active_sessions
  SET last_activity_at = now()
  WHERE id = p_session_id
    AND (
      private.is_service_request()
      OR private.is_totem_request()
      OR user_id = auth.uid()
    );

  RETURN FOUND;
END;
$$;