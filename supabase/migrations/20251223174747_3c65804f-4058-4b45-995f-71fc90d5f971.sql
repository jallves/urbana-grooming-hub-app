-- Remove políticas INSERT duplicadas e inseguras da tabela clients
DROP POLICY IF EXISTS "Allow client registration" ON public.clients;
DROP POLICY IF EXISTS "Allow public client registration" ON public.clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.clients;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.clients;

-- Remove políticas de admin duplicadas (manter apenas a consolidada de managers)
DROP POLICY IF EXISTS "Admins can manage all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Allow admin full access to clients" ON public.clients;

-- Criar política única para registro público de clientes (apenas INSERT)
CREATE POLICY "Public client registration"
ON public.clients
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- A política "Managers can manage clients" já cobre admins/masters/managers
-- A política "Managers can view all clients" já cobre visualização por admins
-- As políticas de usuário próprio já estão corretas