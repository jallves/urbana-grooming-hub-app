-- Parte 2: Criar funções de verificação de permissões

-- Função para verificar se usuário é master
CREATE OR REPLACE FUNCTION public.is_master(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    INNER JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.id = _user_id
      AND u.email = 'joao.colimoides@gmail.com'
      AND ur.role = 'master'::app_role
  );
$$;

-- Função para verificar permissões de módulo
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id UUID, _module_name TEXT)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Pegar a role do usuário (prioriza master, depois admin, depois manager)
  SELECT ur.role INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY 
    CASE ur.role
      WHEN 'master' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      ELSE 4
    END
  LIMIT 1;
  
  -- Se não tem role, não tem acesso
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Master tem acesso a tudo
  IF user_role = 'master' THEN
    RETURN TRUE;
  END IF;
  
  -- Admin não tem acesso a Configurações
  IF user_role = 'admin' AND _module_name = 'configuracoes' THEN
    RETURN FALSE;
  END IF;
  
  -- Manager não tem acesso a ERP/Financeiro e Configurações
  IF user_role = 'manager' AND _module_name IN ('erp', 'financeiro', 'configuracoes') THEN
    RETURN FALSE;
  END IF;
  
  -- Casos padrão: tem acesso
  RETURN TRUE;
END;
$$;

-- Inserir o master (joao.colimoides) se ainda não existir
DO $$
DECLARE
  master_user_id UUID;
BEGIN
  -- Buscar o user_id do João
  SELECT id INTO master_user_id
  FROM auth.users
  WHERE email = 'joao.colimoides@gmail.com';
  
  -- Se existir, garantir que tem a role master
  IF master_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (master_user_id, 'master')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END
$$;