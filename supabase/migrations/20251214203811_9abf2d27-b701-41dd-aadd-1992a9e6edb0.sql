-- Adicionar política para admins atualizarem perfis de clientes
CREATE POLICY "Admins can update client profiles" 
ON public.client_profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('master'::app_role, 'admin'::app_role, 'manager'::app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('master'::app_role, 'admin'::app_role, 'manager'::app_role)
  )
);