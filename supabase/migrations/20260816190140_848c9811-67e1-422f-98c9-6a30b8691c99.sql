CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_cliente_data ON public.painel_agendamentos (cliente_id, data DESC, hora DESC);

CREATE OR REPLACE FUNCTION public.admin_clients_overview()
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  telefone text,
  whatsapp text,
  data_nascimento date,
  created_at timestamptz,
  updated_at timestamptz,
  ultimo_agendamento jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nome, c.email, c.telefone, c.whatsapp, c.data_nascimento,
         c.created_at, c.updated_at,
         CASE WHEN a.data IS NULL THEN NULL
              ELSE jsonb_build_object('data', a.data, 'hora', a.hora, 'status', a.status)
         END AS ultimo_agendamento
  FROM public.painel_clientes c
  LEFT JOIN LATERAL (
    SELECT ag.data, ag.hora, ag.status
    FROM public.painel_agendamentos ag
    WHERE ag.cliente_id = c.id
    ORDER BY ag.data DESC, ag.hora DESC
    LIMIT 1
  ) a ON true
  WHERE public.is_admin_or_higher(auth.uid())
     OR public.is_barber_admin(auth.uid())
     OR public.has_role(auth.uid(), 'manager'::app_role)
  ORDER BY c.nome;
$$;

REVOKE ALL ON FUNCTION public.admin_clients_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_clients_overview() TO authenticated;