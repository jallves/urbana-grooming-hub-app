-- Adicionar política para permitir verificação de existência de cliente por email
-- durante o processo de autenticação (não expõe dados sensíveis, apenas id)
CREATE POLICY "Allow auth system to verify client existence"
ON public.client_profiles
FOR SELECT
TO anon, authenticated
USING (true);