CREATE OR REPLACE FUNCTION public.fila_do_dia()
RETURNS TABLE(id uuid, hora time, status text, status_totem text, cliente_nome text, barbeiro_nome text, servico_nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.hora, a.status, a.status_totem,
         coalesce(c.nome, 'Cliente'),
         coalesce(b.nome, '—'),
         coalesce(s.nome, '—')
  FROM public.painel_agendamentos a
  LEFT JOIN public.painel_clientes c ON c.id = a.cliente_id
  LEFT JOIN public.painel_barbeiros b ON b.id = a.barbeiro_id
  LEFT JOIN public.painel_servicos s ON s.id = a.servico_id
  WHERE a.data = (now() AT TIME ZONE 'America/Sao_Paulo')::date
  ORDER BY a.hora
$$;

GRANT EXECUTE ON FUNCTION public.fila_do_dia() TO anon, authenticated, service_role;