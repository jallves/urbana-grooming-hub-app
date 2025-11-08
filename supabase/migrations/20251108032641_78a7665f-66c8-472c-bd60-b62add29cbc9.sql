-- Melhorar policies de painel_produtos para permitir acesso público aos produtos ativos
-- e permitir que admins gerenciem produtos sem problemas

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Todos podem visualizar produtos ativos" ON painel_produtos;

-- Create new SELECT policy that allows anyone to view active products
CREATE POLICY "Acesso público a produtos ativos"
ON painel_produtos
FOR SELECT
TO public
USING (is_active = true AND estoque > 0);

-- Ensure admin policy has proper WITH CHECK clause
DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON painel_produtos;

CREATE POLICY "Admins podem gerenciar produtos"
ON painel_produtos
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
  OR auth.uid() IS NULL -- Allow service role access
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
  OR auth.uid() IS NULL -- Allow service role access
);