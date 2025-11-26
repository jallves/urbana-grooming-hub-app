-- Criar função SECURITY DEFINER para buscar role do usuário
-- Isso contorna as políticas RLS e evita timeouts
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- Permitir que usuários autenticados chamem esta função
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_user_role IS 'Retorna a role de um usuário específico - SECURITY DEFINER para evitar timeouts de RLS';