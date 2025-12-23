-- Primeiro, remover políticas existentes que podem estar inseguras
DROP POLICY IF EXISTS "Allow public read access" ON public.client_profiles;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.client_profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Admins can view all client profiles" ON public.client_profiles;
DROP POLICY IF EXISTS "Admins can manage all client profiles" ON public.client_profiles;

-- Garantir que RLS está habilitado
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Clientes podem ver apenas seus próprios dados
CREATE POLICY "Clients can view own profile"
ON public.client_profiles
FOR SELECT
USING (auth.uid() = id);

-- Política 2: Clientes podem atualizar apenas seus próprios dados
CREATE POLICY "Clients can update own profile"
ON public.client_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 3: Clientes podem inserir seu próprio perfil
CREATE POLICY "Clients can insert own profile"
ON public.client_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política 4: Administradores e Gerentes podem ver todos os perfis
CREATE POLICY "Admins and managers can view all profiles"
ON public.client_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'master', 'manager')
  )
);

-- Política 5: Administradores e Gerentes podem gerenciar todos os perfis
CREATE POLICY "Admins and managers can manage all profiles"
ON public.client_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'master', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'master', 'manager')
  )
);