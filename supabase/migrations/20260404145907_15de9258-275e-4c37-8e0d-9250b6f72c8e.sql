-- Adicionar política de UPDATE para administradores na tabela painel_agendamentos
CREATE POLICY "Admins can update all appointments"
ON public.painel_agendamentos
FOR UPDATE
TO authenticated
USING (public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_admin_or_higher(auth.uid()));
