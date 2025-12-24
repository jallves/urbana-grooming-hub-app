-- Adicionar política para permitir leitura pública de clientes para busca no totem
-- Isso é necessário porque o totem opera sem autenticação

CREATE POLICY "Public can view client profiles for totem search" 
ON public.client_profiles 
FOR SELECT 
USING (true);