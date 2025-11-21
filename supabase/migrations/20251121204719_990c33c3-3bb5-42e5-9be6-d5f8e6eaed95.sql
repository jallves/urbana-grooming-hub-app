-- Atualizar função revoke_admin_manager_access para deletar o usuário do auth.users
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
  v_user_id UUID;
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

  v_user_id := v_employee.user_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este funcionário não tem acesso ao sistema'
    );
  END IF;

  -- Deletar usuário do auth.users
  DELETE FROM auth.users WHERE id = v_user_id;

  -- Remover role
  DELETE FROM user_roles WHERE user_id = v_user_id;

  -- Atualizar employee
  UPDATE employees
  SET 
    user_id = NULL,
    status = 'inactive',
    requires_password_change = false,
    updated_at = now()
  WHERE id = p_employee_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Acesso revogado com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;