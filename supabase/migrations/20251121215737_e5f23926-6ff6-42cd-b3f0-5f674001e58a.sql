-- Garantir que João está como master
UPDATE admin_users 
SET role = 'master'
WHERE email = 'joao.colimoides@gmail.com';

-- Atualizar user_roles para master
INSERT INTO user_roles (user_id, role)
VALUES (
  (SELECT user_id FROM admin_users WHERE email = 'joao.colimoides@gmail.com'),
  'master'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar ou substituir função para buscar detalhes de admin/manager (sem master)
CREATE OR REPLACE FUNCTION public.get_admin_manager_details()
RETURNS TABLE (
  employee_id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  user_id UUID,
  has_access BOOLEAN,
  created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  WHERE e.role IN ('admin', 'manager')
    AND e.role != 'master' -- Excluir master da lista
  ORDER BY e.name;
END;
$$;

-- Criar função para criar usuário admin/manager
CREATE OR REPLACE FUNCTION public.create_admin_manager_user(
  p_employee_id UUID,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee RECORD;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Buscar dados do funcionário
  SELECT * INTO v_employee
  FROM employees
  WHERE id = p_employee_id
    AND role IN ('admin', 'manager')
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Funcionário não encontrado ou não elegível para acesso'
    );
  END IF;

  -- Verificar se já existe usuário auth com este email
  -- (fazemos via função do Supabase Admin API na edge function)
  
  -- Criar entrada na tabela admin_users se não existir
  INSERT INTO admin_users (email, name, role, user_id)
  VALUES (
    v_employee.email,
    v_employee.name,
    v_employee.role,
    NULL -- será preenchido pela edge function
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Retornar sucesso (a criação do usuário auth será feita pela edge function)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pronto para criar usuário auth',
    'employee', jsonb_build_object(
      'id', v_employee.id,
      'email', v_employee.email,
      'name', v_employee.name,
      'role', v_employee.role
    )
  );
END;
$$;

-- Atualizar função de revogar acesso
CREATE OR REPLACE FUNCTION public.revoke_admin_manager_access(
  p_employee_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee RECORD;
  v_email TEXT;
BEGIN
  -- Buscar funcionário
  SELECT * INTO v_employee
  FROM employees
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Funcionário não encontrado'
    );
  END IF;

  -- Não permitir revogar acesso do master
  IF v_employee.email = 'joao.colimoides@gmail.com' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Não é possível revogar acesso do usuário master'
    );
  END IF;

  -- Limpar user_id do employee
  UPDATE employees
  SET 
    user_id = NULL,
    updated_at = NOW()
  WHERE id = p_employee_id;

  -- Deletar de admin_users
  DELETE FROM admin_users
  WHERE email = v_employee.email;

  -- Deletar roles (será feito em cascade)
  -- O usuário auth será deletado pela edge function

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Acesso revogado com sucesso'
  );
END;
$$;