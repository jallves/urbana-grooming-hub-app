-- Remover versões específicas das funções
DROP FUNCTION IF EXISTS public.has_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_barber(uuid) CASCADE;

-- Criar função SECURITY DEFINER para verificar roles
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
  );
$$;

-- Criar função auxiliar para verificar se usuário é admin
CREATE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role);
$$;

-- Criar função auxiliar para verificar se usuário é barbeiro
CREATE FUNCTION public.is_barber(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'barber'::app_role) OR 
         EXISTS (
           SELECT 1 
           FROM public.painel_barbeiros pb
           INNER JOIN auth.users u ON u.email = pb.email
           WHERE u.id = _user_id 
           AND pb.is_active = true
         );
$$;

-- Recriar políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Recriar políticas para business_hours
CREATE POLICY "Admin users can manage business hours"
ON public.business_hours
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Recriar políticas para staff
CREATE POLICY "Admin users can manage staff"
ON public.staff
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Recriar políticas para special_dates
CREATE POLICY "Admin users can manage special dates"
ON public.special_dates
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);