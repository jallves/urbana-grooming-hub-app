CREATE OR REPLACE FUNCTION public.totem_search_client(p_query text)
RETURNS TABLE(id uuid, nome text, email text, telefone text, whatsapp text, user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_digits text := regexp_replace(coalesce(p_query, ''), '\D', '', 'g');
  v_tail text;
BEGIN
  IF NOT private.is_service_request()
     AND NOT private.is_totem_request()
     AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF length(v_digits) >= 8 THEN
    v_tail := right(v_digits, 8);
  ELSE
    v_tail := NULL;
  END IF;

  RETURN QUERY
  SELECT pc.id, pc.nome, pc.email, pc.telefone, pc.whatsapp, pc.user_id
  FROM public.painel_clientes pc
  WHERE
    (
      v_digits <> '' AND (
        regexp_replace(coalesce(pc.telefone, ''), '\D', '', 'g') ILIKE '%' || v_digits || '%'
        OR regexp_replace(coalesce(pc.whatsapp, ''), '\D', '', 'g') ILIKE '%' || v_digits || '%'
        OR (
          v_tail IS NOT NULL AND (
            regexp_replace(coalesce(pc.telefone, ''), '\D', '', 'g') LIKE '%' || v_tail
            OR regexp_replace(coalesce(pc.whatsapp, ''), '\D', '', 'g') LIKE '%' || v_tail
          )
        )
      )
    )
    OR (
      v_digits = '' AND (
        pc.nome ILIKE '%' || p_query || '%'
        OR pc.email ILIKE '%' || p_query || '%'
      )
    )
  ORDER BY pc.created_at DESC
  LIMIT 20;
END;
$$;