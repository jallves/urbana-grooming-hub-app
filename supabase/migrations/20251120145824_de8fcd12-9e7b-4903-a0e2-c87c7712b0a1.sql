-- Remover todas as políticas de UPDATE e DELETE para barbeiros nas tabelas de agendamentos

-- Políticas para painel_agendamentos
DROP POLICY IF EXISTS "Barbeiros podem atualizar seus agendamentos" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Barbeiros podem excluir seus agendamentos" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Staff can update their own appointments" ON public.painel_agendamentos;
DROP POLICY IF EXISTS "Staff can delete their own appointments" ON public.painel_agendamentos;

-- Políticas para appointments
DROP POLICY IF EXISTS "Barbeiros podem atualizar seus agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Barbeiros podem excluir seus agendamentos" ON public.appointments;
DROP POLICY IF EXISTS "Staff can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can delete their own appointments" ON public.appointments;

-- Garantir que barbeiros só possam VISUALIZAR seus próprios agendamentos
-- Política para painel_agendamentos (somente leitura)
CREATE POLICY "Barbeiros podem visualizar seus agendamentos"
ON public.painel_agendamentos
FOR SELECT
TO authenticated
USING (
  barbeiro_id IN (
    SELECT id FROM public.painel_barbeiros 
    WHERE staff_id IN (
      SELECT id FROM public.staff 
      WHERE user_id = auth.uid() AND role = 'barber'
    )
  )
);

-- Política para appointments (somente leitura)
CREATE POLICY "Barbeiros podem visualizar seus agendamentos"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  staff_id IN (
    SELECT id FROM public.staff 
    WHERE user_id = auth.uid() AND role = 'barber'
  )
);