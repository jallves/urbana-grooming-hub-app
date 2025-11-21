-- Corrigir função get_user_role para priorizar role master

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
  -- Buscar email do auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Master direto por email (garantia extra)
  IF v_email = 'joao@coremodis.com.br' OR v_email = 'joao.colimoides@gmail.com' THEN
    RETURN 'master';
  END IF;
  
  -- Buscar role na tabela user_roles com PRIORIDADE (master > admin > manager > barber)
  -- Usando ORDER BY para garantir que a role mais alta é retornada
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role
      WHEN 'master' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'barber' THEN 4
      ELSE 5
    END
  LIMIT 1;
  
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;
  
  -- Se não achou em user_roles, buscar em employees
  SELECT role INTO v_role
  FROM public.employees
  WHERE user_id = p_user_id
  AND status = 'active'
  LIMIT 1;
  
  RETURN v_role;
END;
$$;