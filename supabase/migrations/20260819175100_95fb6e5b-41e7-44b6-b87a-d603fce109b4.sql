-- Totem-only routines now require a valid kiosk token.
CREATE OR REPLACE FUNCTION public.totem_search_client(p_query text)
RETURNS TABLE(id uuid, nome text, email text, telefone text, whatsapp text, user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT private.is_totem_request() AND auth.uid() IS NULL THEN
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

-- Stock decrements must come from the kiosk or a signed-in user.
CREATE OR REPLACE FUNCTION public.decrease_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT private.is_totem_request() AND auth.uid() IS NULL THEN
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

-- Session bookkeeping requires a signed-in user or an authenticated kiosk.
CREATE OR REPLACE FUNCTION public.invalidate_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL AND NOT private.is_totem_request() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.active_sessions
  SET is_active = false
  WHERE id = p_session_id
    AND (user_id = auth.uid() OR private.is_totem_request() OR public.is_admin_or_higher(auth.uid()));

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
  IF auth.uid() IS NULL AND NOT private.is_totem_request() THEN
    RETURN false;
  END IF;

  UPDATE public.active_sessions
  SET last_activity_at = now()
  WHERE id = p_session_id
    AND (user_id = auth.uid() OR private.is_totem_request());

  RETURN FOUND;
END;
$$;