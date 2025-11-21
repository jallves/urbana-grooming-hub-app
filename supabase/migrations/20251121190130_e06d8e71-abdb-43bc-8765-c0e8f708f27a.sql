-- Criar função para adicionar usuário admin/gerente (RPC segura)
CREATE OR REPLACE FUNCTION create_admin_manager_user(
  p_employee_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Verificar se o usuário atual é master ou admin
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin')
    )
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;

  -- Verificar se o funcionário existe e tem role adequada
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM employees 
      WHERE id = p_employee_id 
      AND role IN ('admin', 'manager')
      AND status = 'active'
    )
  ) THEN
    RAISE EXCEPTION 'Funcionário inválido ou sem permissão adequada';
  END IF;

  -- Criar usuário no auth (via extensão)
  -- Nota: Esta operação requer privilégios SECURITY DEFINER
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', (SELECT name FROM employees WHERE id = p_employee_id)),
    NOW(),
    NOW(),
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  -- Atualizar employee com user_id
  UPDATE employees
  SET user_id = v_user_id,
      updated_at = NOW()
  WHERE id = p_employee_id;

  -- Adicionar role na tabela user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, p_role::app_role);

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Usuário criado com sucesso'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Criar função para remover acesso de admin/gerente
CREATE OR REPLACE FUNCTION revoke_admin_manager_access(
  p_employee_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_result JSON;
BEGIN
  -- Verificar se o usuário atual é master ou admin
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin')
    )
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem revogar acessos';
  END IF;

  -- Buscar employee
  SELECT user_id, email INTO v_user_id, v_email
  FROM employees
  WHERE id = p_employee_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Funcionário não possui acesso ao sistema';
  END IF;

  -- Proteger usuário master
  IF v_email = 'joao.colimoides@gmail.com' THEN
    RAISE EXCEPTION 'Não é possível revogar acesso do usuário master';
  END IF;

  -- Remover role
  DELETE FROM user_roles
  WHERE user_id = v_user_id;

  -- Limpar user_id do employee
  UPDATE employees
  SET user_id = NULL,
      updated_at = NOW()
  WHERE id = p_employee_id;

  v_result := json_build_object(
    'success', true,
    'message', 'Acesso revogado com sucesso'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Garantir políticas RLS adequadas para employees
DROP POLICY IF EXISTS "Admins can manage all employees" ON employees;
CREATE POLICY "Admins can manage all employees"
ON employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('master', 'admin')
  )
);

-- Políticas para user_roles (se não existirem)
DROP POLICY IF EXISTS "Masters and admins can manage roles" ON user_roles;
CREATE POLICY "Masters and admins can manage roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('master', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('master', 'admin')
  )
);

-- Criar view para listar usuários com detalhes completos
CREATE OR REPLACE VIEW admin_user_details AS
SELECT 
  e.id as employee_id,
  e.name,
  e.email,
  e.role,
  e.status,
  e.user_id,
  e.created_at as employee_created_at,
  u.email_confirmed_at as access_granted_at,
  u.last_sign_in_at,
  u.created_at as user_created_at,
  ur.role as system_role
FROM employees e
LEFT JOIN auth.users u ON e.user_id = u.id
LEFT JOIN user_roles ur ON e.user_id = ur.user_id
WHERE e.role IN ('admin', 'manager');

-- Permitir que admins visualizem esta view
GRANT SELECT ON admin_user_details TO authenticated;