-- Garantir que as políticas RLS de comissões estão corretas
-- Remover políticas antigas que possam causar problemas
DROP POLICY IF EXISTS "Barbers can view own commissions" ON public.barber_commissions;

-- Criar política correta para barbeiros visualizarem apenas suas comissões
CREATE POLICY "Barbeiros visualizam apenas suas comissões"
ON public.barber_commissions
FOR SELECT
TO authenticated
USING (
  barber_id IN (
    SELECT id FROM public.staff 
    WHERE user_id = auth.uid() 
    AND role = 'barber'
    AND is_active = true
  )
);