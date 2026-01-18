-- Política para clientes autenticados verem barbeiros dos seus agendamentos (mesmo inativos)
CREATE POLICY "Clients can view barbers from their appointments"
ON public.painel_barbeiros
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT barbeiro_id FROM public.painel_agendamentos 
    WHERE cliente_id IN (
      SELECT id FROM public.painel_clientes WHERE user_id = auth.uid()
    )
  )
);

-- Política para clientes autenticados verem serviços dos seus agendamentos (mesmo inativos)
CREATE POLICY "Clients can view services from their appointments"
ON public.painel_servicos
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT servico_id FROM public.painel_agendamentos 
    WHERE cliente_id IN (
      SELECT id FROM public.painel_clientes WHERE user_id = auth.uid()
    )
  )
);