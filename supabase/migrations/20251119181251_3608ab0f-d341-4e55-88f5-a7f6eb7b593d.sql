-- Drop e recriar política de admin com permissões completas
DROP POLICY IF EXISTS "Admins podem gerenciar servicos" ON painel_servicos;

CREATE POLICY "Admins podem gerenciar servicos"
ON painel_servicos
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);