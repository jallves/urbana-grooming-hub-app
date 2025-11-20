-- Criar função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_user_admin.user_id
      AND role = 'admin'
  );
$$;

-- Criar função para verificar se o usuário é staff
CREATE OR REPLACE FUNCTION public.is_user_staff(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff
    WHERE staff.user_id = is_user_staff.user_id
      AND is_active = true
  );
$$;

-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Admins podem visualizar todos os funcionários" ON public.staff;
DROP POLICY IF EXISTS "Admins podem inserir funcionários" ON public.staff;
DROP POLICY IF EXISTS "Admins podem atualizar funcionários" ON public.staff;
DROP POLICY IF EXISTS "Admins podem deletar funcionários" ON public.staff;
DROP POLICY IF EXISTS "Funcionários podem visualizar seus próprios dados" ON public.staff;
DROP POLICY IF EXISTS "Funcionários podem atualizar seus próprios dados" ON public.staff;

-- Criar novas políticas sem recursão usando as funções SECURITY DEFINER
CREATE POLICY "Admins podem visualizar todos os funcionários"
ON public.staff
FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins podem inserir funcionários"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar funcionários"
ON public.staff
FOR UPDATE
TO authenticated
USING (public.is_user_admin(auth.uid()))
WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins podem deletar funcionários"
ON public.staff
FOR DELETE
TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Funcionários podem visualizar seus próprios dados"
ON public.staff
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Funcionários podem atualizar seus próprios dados"
ON public.staff
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());