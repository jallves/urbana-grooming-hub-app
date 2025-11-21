-- Remover view problemática que expõe auth.users
DROP VIEW IF EXISTS admin_user_details;

-- Criar função segura para buscar detalhes dos usuários admin/gerente
CREATE OR REPLACE FUNCTION get_admin_manager_details()
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
  -- Verificar se o usuário é master ou admin
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('master', 'admin')
    )
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
  WHERE e.role IN ('admin', 'manager')
  ORDER BY e.name;
END;
$$;