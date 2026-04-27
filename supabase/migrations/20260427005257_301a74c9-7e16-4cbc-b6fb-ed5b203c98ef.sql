-- Permitir que o barbeiro autenticado atualize o próprio registro em painel_barbeiros
-- (necessário para o toggle "Disponível para Novos Agendamentos" no painel do barbeiro)
CREATE POLICY "Barbers can update own record"
ON public.painel_barbeiros
FOR UPDATE
TO authenticated
USING (staff_id = auth.uid())
WITH CHECK (staff_id = auth.uid());

-- Também garantir SELECT do próprio registro (caso o usuário não seja "ativo")
CREATE POLICY "Barbers can view own record"
ON public.painel_barbeiros
FOR SELECT
TO authenticated
USING (staff_id = auth.uid());