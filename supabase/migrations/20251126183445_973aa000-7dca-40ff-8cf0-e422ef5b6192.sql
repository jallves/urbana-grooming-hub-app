-- Criar índice na tabela user_roles para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Verificar e otimizar as políticas RLS da tabela user_roles
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_roles;

-- Criar política simples e eficiente para leitura de roles
-- Permite que usuários autenticados leiam apenas suas próprias roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());