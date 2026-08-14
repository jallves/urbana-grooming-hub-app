CREATE OR REPLACE FUNCTION public.totem_search_client(p_query text)
RETURNS TABLE(id uuid, nome text, email text, telefone text, whatsapp text, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (
    SELECT regexp_replace(coalesce(p_query,''), '\D', '', 'g') AS digits,
           lower(trim(coalesce(p_query,''))) AS raw
  )
  SELECT c.id, c.nome, c.email, c.telefone, c.whatsapp, c.user_id
  FROM public.painel_clientes c, q
  WHERE (
      length(q.digits) >= 8
      AND (
        right(regexp_replace(coalesce(c.telefone,''), '\D', '', 'g'), 8) = right(q.digits, 8)
        OR right(regexp_replace(coalesce(c.whatsapp,''), '\D', '', 'g'), 8) = right(q.digits, 8)
      )
    )
    OR (q.raw LIKE '%@%' AND lower(c.email) = q.raw)
  LIMIT 5
$$;

GRANT EXECUTE ON FUNCTION public.totem_search_client(text) TO anon, authenticated, service_role;