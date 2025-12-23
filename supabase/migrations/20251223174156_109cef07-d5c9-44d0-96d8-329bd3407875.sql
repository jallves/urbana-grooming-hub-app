-- =====================================================
-- CORREÇÃO DE SEGURANÇA: TABELA clients
-- Remover políticas públicas que expõem dados sensíveis
-- =====================================================

-- Remover políticas inseguras com "true" que permitem acesso público
DROP POLICY IF EXISTS "Allow full access to admin users" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can update own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can view own data" ON public.clients;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.clients;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.clients;

-- Manter políticas de registro público (necessário para novos clientes)
-- As políticas "Allow client registration", "Allow public client registration", 
-- "Enable insert for authenticated users only", "Permitir inserção para usuários autenticados"
-- já existem e são necessárias para o cadastro

-- Políticas que já estão corretas e serão mantidas:
-- - "Admins can manage all clients" (admin)
-- - "Admins can view all clients" (admin)
-- - "Allow admin full access to clients" (admin)
-- - "Users can update own client profile" (auth.uid() = id)
-- - "Users can view own client profile" (auth.uid() = id)

-- Adicionar política para managers também poderem gerenciar
CREATE POLICY "Managers can view all clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can manage clients"
ON public.clients
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin', 'manager')
  )
);