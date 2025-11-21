-- Atualizar função has_role para evitar recursão infinita em RLS
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

-- Recriar políticas da tabela user_roles usando has_role
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'master'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Recriar políticas da tabela employees usando has_role
DROP POLICY IF EXISTS "Admins and managers can view employees" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;

CREATE POLICY "Admins and managers can view employees"
ON employees FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'master'::app_role) OR 
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can manage employees"
ON employees FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'master'::app_role) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'master'::app_role) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Atualizar função get_admin_manager_details para usar has_role
CREATE OR REPLACE FUNCTION get_admin_manager_details()
RETURNS TABLE (
  employee_id uuid,
  name text,
  email text,
  role text,
  status text,
  user_id uuid,
  has_access boolean,
  created_at timestamptz,
  last_login timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário tem permissão (master ou admin)
  IF NOT (
    public.has_role(auth.uid(), 'master'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT 
    e.id as employee_id,
    e.name,
    e.email,
    e.role,
    e.status,
    e.user_id,
    (e.user_id IS NOT NULL) as has_access,
    e.created_at,
    e.last_login
  FROM employees e
  WHERE e.role IN ('master', 'admin', 'manager')
  ORDER BY 
    CASE e.role
      WHEN 'master' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
    END,
    e.name;
END;
$$;

-- Atualizar função create_admin_manager_user para usar has_role
CREATE OR REPLACE FUNCTION create_admin_manager_user(
  p_employee_id uuid,
  p_email text,
  p_password text,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verificar se o usuário tem permissão (master ou admin)
  IF NOT (
    public.has_role(auth.uid(), 'master'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  -- Verificar se o funcionário existe e tem o role correto
  IF NOT EXISTS (
    SELECT 1 FROM employees 
    WHERE id = p_employee_id 
    AND role IN ('admin', 'manager')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Funcionário não encontrado ou role inválido');
  END IF;

  -- Verificar se já tem acesso
  IF EXISTS (
    SELECT 1 FROM employees WHERE id = p_employee_id AND user_id IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Funcionário já possui acesso');
  END IF;

  -- Buscar o user_id do auth.users pelo email (deve ser criado no frontend primeiro)
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado em auth.users. Crie primeiro no frontend.');
  END IF;

  -- Atualizar employee com user_id
  UPDATE employees 
  SET user_id = v_user_id,
      last_login = NULL
  WHERE id = p_employee_id;

  -- Inserir role em user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, p_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

-- Atualizar função revoke_admin_manager_access para usar has_role
CREATE OR REPLACE FUNCTION revoke_admin_manager_access(p_employee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  -- Verificar se o usuário tem permissão (master ou admin)
  IF NOT (
    public.has_role(auth.uid(), 'master'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  -- Buscar dados do funcionário
  SELECT user_id, email INTO v_user_id, v_email
  FROM employees
  WHERE id = p_employee_id;

  -- Proteger usuário master
  IF v_email = 'joao.colimoides@gmail.com' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não é possível revogar acesso do usuário master');
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Funcionário não possui acesso');
  END IF;

  -- Remover roles do user_roles (exceto master)
  DELETE FROM user_roles 
  WHERE user_id = v_user_id 
  AND role != 'master'::app_role;

  -- Limpar user_id do employee
  UPDATE employees 
  SET user_id = NULL
  WHERE id = p_employee_id;

  RETURN jsonb_build_object('success', true);
END;
$$;