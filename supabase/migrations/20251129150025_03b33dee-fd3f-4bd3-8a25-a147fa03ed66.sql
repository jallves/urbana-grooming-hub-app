-- =============================================
-- Políticas RLS para financial_records (Barbeiros)
-- =============================================

-- Permitir barbeiros visualizar suas próprias comissões
CREATE POLICY "Barbeiros podem ver suas comissões"
ON public.financial_records
FOR SELECT
TO authenticated
USING (
  transaction_type = 'commission' 
  AND barber_id IN (
    SELECT id FROM public.staff 
    WHERE user_id = auth.uid() 
    AND role = 'barber'
  )
);

-- Permitir barbeiros visualizar receitas de seus serviços
CREATE POLICY "Barbeiros podem ver receitas de seus serviços"
ON public.financial_records
FOR SELECT
TO authenticated
USING (
  transaction_type = 'revenue' 
  AND barber_id IN (
    SELECT id FROM public.staff 
    WHERE user_id = auth.uid() 
    AND role = 'barber'
  )
);