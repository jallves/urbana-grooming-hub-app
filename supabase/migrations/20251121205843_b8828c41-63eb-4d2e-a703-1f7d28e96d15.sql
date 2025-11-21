-- Recriar a função get_user_role de forma MUITO mais simples e sem recursão
-- Evitar qualquer possibilidade de loop infinito

DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.can_access_module(UUID, TEXT);

-- Função super simples que verifica role diretamente
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
  
  -- Master direto por email
  IF v_email = 'joao@coremodis.com.br' OR v_email = 'joao.colimoides@gmail.com' THEN
    RETURN 'master';
  END IF;
  
  -- Buscar na tabela user_roles primeiro (mais rápido)
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
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

GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO anon;