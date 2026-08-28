CREATE INDEX IF NOT EXISTS idx_painel_clientes_user_id ON public.painel_clientes (user_id);
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_barbeiro_id ON public.painel_agendamentos (barbeiro_id);
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_servico_id ON public.painel_agendamentos (servico_id);
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_cliente_status ON public.painel_agendamentos (cliente_id, status);

DROP POLICY IF EXISTS "Clients can view barbers from their appointments" ON public.painel_barbeiros;
CREATE POLICY "Clients can view barbers from their appointments"
ON public.painel_barbeiros FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.painel_agendamentos a
  WHERE a.barbeiro_id = painel_barbeiros.id
    AND private.owns_client(a.cliente_id)
));

DROP POLICY IF EXISTS "Clients can view services from their appointments" ON public.painel_servicos;
CREATE POLICY "Clients can view services from their appointments"
ON public.painel_servicos FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.painel_agendamentos a
  WHERE a.servico_id = painel_servicos.id
    AND private.owns_client(a.cliente_id)
));

ANALYZE public.painel_agendamentos;
ANALYZE public.painel_clientes;