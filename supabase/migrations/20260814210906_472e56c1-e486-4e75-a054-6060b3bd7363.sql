DROP POLICY IF EXISTS "Allow public select for totem" ON public.painel_clientes;

CREATE POLICY "Staff can view clients"
ON public.painel_clientes FOR SELECT TO authenticated
USING (
  public.is_admin_or_higher(auth.uid())
  OR public.has_role(auth.uid(), 'barber')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_barber_admin(auth.uid())
);

REVOKE SELECT ON public.painel_clientes FROM anon;
GRANT SELECT ON public.painel_clientes TO authenticated;
GRANT ALL ON public.painel_clientes TO service_role;

CREATE OR REPLACE FUNCTION public.totem_search_client(p_query text)
RETURNS TABLE(id uuid, nome text, email text, telefone text, whatsapp text, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nome, c.email, c.telefone, c.whatsapp, c.user_id
  FROM public.painel_clientes c
  WHERE length(regexp_replace(coalesce(p_query,''), '\s', '', 'g')) >= 4
    AND (
      regexp_replace(coalesce(c.telefone,''), '\D', '', 'g') = regexp_replace(p_query, '\D', '', 'g')
      OR regexp_replace(coalesce(c.whatsapp,''), '\D', '', 'g') = regexp_replace(p_query, '\D', '', 'g')
      OR lower(c.email) = lower(trim(p_query))
    )
  LIMIT 5
$$;

GRANT EXECUTE ON FUNCTION public.totem_search_client(text) TO anon, authenticated, service_role;