
-- FIX: Remover política recursiva que causa loop infinito
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Substituir por políticas não-recursivas seguras
-- Masters e admins podem gerenciar roles através de um check direto sem função recursiva
CREATE POLICY "Masters can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
);

-- GARANTIR que usuários autenticados SEMPRE possam ler seus próprios roles
-- Essa política é CRÍTICA e não causa recursão
DROP POLICY IF EXISTS "Authenticated can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;

CREATE POLICY "Authenticated users can read all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (true);

-- Permitir leitura anônima também (para casos de login)
CREATE POLICY "Public can read roles" 
ON public.user_roles 
FOR SELECT 
TO public
USING (true);
