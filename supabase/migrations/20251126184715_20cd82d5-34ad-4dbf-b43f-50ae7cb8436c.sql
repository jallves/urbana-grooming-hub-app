-- CORRIGIR RECURSÃO INFINITA: Criar função security definer para checar tipo de usuário
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND user_type = 'admin'
  );
$$;

-- Remover política problemática que causa recursão
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;

-- Criar nova política usando a função security definer
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id  -- Usuário pode ver seu próprio perfil
  OR public.is_admin_user()  -- OU é admin (sem recursão)
);

-- Garantir que profiles tem RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;