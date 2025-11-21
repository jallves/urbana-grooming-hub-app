-- Adicionar campo para controlar troca de senha obrigatória
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT false;

-- Atualizar a função create_admin_manager_user para marcar senha como temporária
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
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Funcionário não encontrado'
    );
  END IF;

  -- Verificar se já existe um usuário auth
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_employee.email;

  IF v_user_id IS NOT NULL THEN
    -- Atualizar senha do usuário existente
    UPDATE auth.users
    SET 
      encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = now()
    WHERE id = v_user_id;
  ELSE
    -- Criar novo usuário
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_employee.email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object('name', v_employee.name, 'role', v_employee.role),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;
  END IF;

  -- Atualizar employee com user_id e marcar para trocar senha
  UPDATE employees
  SET 
    user_id = v_user_id,
    status = 'active',
    requires_password_change = true,
    updated_at = now()
  WHERE id = p_employee_id;

  -- Garantir que existe role na tabela user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (v_user_id, v_employee.role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Usuário criado com sucesso. Senha temporária ativa.'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função para atualizar senha e remover flag de troca obrigatória
CREATE OR REPLACE FUNCTION public.update_user_password_first_login(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar senha no auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;

  -- Remover flag de troca obrigatória
  UPDATE employees
  SET 
    requires_password_change = false,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Senha atualizada com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;