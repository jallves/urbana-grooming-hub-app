-- Primeiro, vamos verificar se o usuário existe no auth.users
-- Se não existir, precisaremos criá-lo manualmente no dashboard

-- Inserir role de master para o usuário joao.colimoides@gmail.com
-- Usamos uma função que vai inserir a role quando o usuário fizer login

-- Criar função para auto-atribuir role master ao joao.colimoides@gmail.com
CREATE OR REPLACE FUNCTION public.auto_assign_master_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o email é do master developer, atribui role master automaticamente
  IF NEW.email = 'joao.colimoides@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'master')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para executar após confirmação de email ou login
DROP TRIGGER IF EXISTS on_auth_user_created_assign_master ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_master
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_master_role();

-- Garantir que RLS está configurado corretamente para user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados lerem suas próprias roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Política para admins/masters gerenciarem roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin')
  )
);

-- Garantir que a função has_role existe e está correta
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin ou superior
CREATE OR REPLACE FUNCTION public.is_admin_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('master', 'admin')
  )
$$;