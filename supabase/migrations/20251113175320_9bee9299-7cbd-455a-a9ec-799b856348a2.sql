-- Corrigir funções RPC para usar nomes de parâmetros sem underscore
-- Isso garante compatibilidade com TypeScript

-- Remover versões anteriores
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_barber(uuid) CASCADE;

-- Recriar has_role com parâmetros sem underscore
CREATE FUNCTION public.has_role(user_id uuid, role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = has_role.user_id
      AND user_roles.role = has_role.role
  );
$$;

-- Recriar is_admin
CREATE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(is_admin.user_id, 'admin'::app_role);
$$;

-- Recriar is_barber
CREATE FUNCTION public.is_barber(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(is_barber.user_id, 'barber'::app_role) OR 
         EXISTS (
           SELECT 1 
           FROM public.painel_barbeiros pb
           INNER JOIN auth.users u ON u.email = pb.email
           WHERE u.id = is_barber.user_id
           AND pb.is_active = true
         );
$$;