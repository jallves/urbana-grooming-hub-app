
-- Criar política para permitir que clientes vejam barbeiros ativos
CREATE POLICY "Allow clients to view active staff for appointments" 
  ON public.staff 
  FOR SELECT 
  USING (is_active = true);
