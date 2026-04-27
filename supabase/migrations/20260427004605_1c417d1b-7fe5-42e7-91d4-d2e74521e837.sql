-- Permitir que barbeiros visualizem seus próprios lançamentos em contas_pagar
-- (vales, comissões, gorjetas), filtrados pelo nome do fornecedor.
CREATE POLICY "Barbers can view own contas_pagar entries"
ON public.contas_pagar
FOR SELECT
TO authenticated
USING (
  fornecedor IN (
    SELECT pb.nome
    FROM public.painel_barbeiros pb
    WHERE pb.staff_id = auth.uid()
  )
);

-- Permitir que barbeiros administradores visualizem todos os lançamentos
CREATE POLICY "Barber admins can view all contas_pagar"
ON public.contas_pagar
FOR SELECT
TO authenticated
USING (public.is_barber_admin(auth.uid()));