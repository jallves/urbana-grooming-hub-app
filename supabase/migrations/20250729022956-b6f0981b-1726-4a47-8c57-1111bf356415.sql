
-- Habilitar RLS na tabela barber_commissions se ainda não estiver
ALTER TABLE public.barber_commissions ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que admins leiam todas as comissões
CREATE POLICY "Admins can view all commissions" ON public.barber_commissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Criar política para permitir que admins atualizem todas as comissões
CREATE POLICY "Admins can update all commissions" ON public.barber_commissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Criar política para permitir que admins insiram comissões
CREATE POLICY "Admins can insert commissions" ON public.barber_commissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Criar política para permitir que o sistema (triggers) inserir comissões
CREATE POLICY "System can insert commissions" ON public.barber_commissions
FOR INSERT
WITH CHECK (true);

-- Permitir que barbeiros vejam suas próprias comissões
CREATE POLICY "Barbers can view own commissions" ON public.barber_commissions
FOR SELECT
USING (
  barber_id IN (
    SELECT s.id FROM public.staff s
    WHERE s.email = auth.email()
    AND s.is_active = true
  )
);
