-- Criar função para obter role do usuário de forma simples e eficiente
-- Esta função retorna 'master', 'admin', 'manager', 'barber' ou NULL

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_email TEXT;
BEGIN
  -- Buscar email do usuário
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Verificar se é master (joao@coremodis.com.br)
  IF v_email = 'joao@coremodis.com.br' THEN
    RETURN 'master';
  END IF;
  
  -- Buscar role na tabela user_roles
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role::TEXT
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'barber' THEN 3
      ELSE 4
    END
  LIMIT 1;
  
  -- Se não encontrou em user_roles, verificar em employees
  IF v_role IS NULL THEN
    SELECT role INTO v_role
    FROM public.employees
    WHERE user_id = p_user_id
    AND status = 'active'
    LIMIT 1;
  END IF;
  
  RETURN v_role;
END;
$$;

-- Função simplificada para verificar se pode acessar um módulo
CREATE OR REPLACE FUNCTION public.can_access_module(p_user_id UUID, p_module_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := public.get_user_role(p_user_id);
  
  -- Master tem acesso total
  IF v_role = 'master' THEN
    RETURN TRUE;
  END IF;
  
  -- Admin tem acesso a tudo exceto configurações
  IF v_role = 'admin' THEN
    RETURN p_module_name != 'configuracoes';
  END IF;
  
  -- Manager tem restrições em financeiro e configurações
  IF v_role = 'manager' THEN
    RETURN p_module_name NOT IN ('financeiro', 'configuracoes');
  END IF;
  
  -- Outros não têm acesso por padrão
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_module TO authenticated;