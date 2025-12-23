-- Remover política de visualização pública da tabela barber_commissions
DROP POLICY IF EXISTS "Public view commissions" ON public.barber_commissions;