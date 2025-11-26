-- SOLUÇÃO DEFINITIVA PARA TIMEOUT DE ROLES
-- Remover todas as políticas complexas e criar políticas simples e diretas

-- 1. Dropar todas as políticas existentes na tabela user_roles
DROP POLICY IF EXISTS "Authenticated users can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Masters can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public can read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;

-- 2. Criar políticas SIMPLES e RÁPIDAS (sem subqueries complexas)

-- Política de SELECT: Qualquer usuário autenticado pode ler qualquer role
CREATE POLICY "authenticated_read_all_roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (true);

-- Política de INSERT: Apenas service_role pode inserir
CREATE POLICY "service_role_insert" 
ON public.user_roles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Política de UPDATE: Apenas service_role pode atualizar
CREATE POLICY "service_role_update" 
ON public.user_roles 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Política de DELETE: Apenas service_role pode deletar
CREATE POLICY "service_role_delete" 
ON public.user_roles 
FOR DELETE 
TO service_role
USING (true);

-- 3. Garantir que o índice existe
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 4. Adicionar comentários
COMMENT ON POLICY "authenticated_read_all_roles" ON public.user_roles IS 
'Permite que usuários autenticados leiam qualquer role - simplificado para evitar timeouts';

COMMENT ON TABLE public.user_roles IS 
'Tabela de roles de usuários - políticas simplificadas para performance máxima';