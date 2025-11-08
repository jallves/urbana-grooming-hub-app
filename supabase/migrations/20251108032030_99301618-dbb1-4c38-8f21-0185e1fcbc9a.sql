-- Fix painel_produtos RLS policies to allow INSERT/UPDATE/DELETE for admins

-- Drop existing policy and recreate with proper WITH CHECK clause
DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON painel_produtos;

-- Create comprehensive admin policy for all operations
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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);