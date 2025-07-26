
-- Função para verificar se existe um usuário autenticado com email específico
CREATE OR REPLACE FUNCTION public.check_auth_user_exists(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists BOOLEAN := FALSE;
BEGIN
  -- Verificar se existe um usuário na auth.users com este email
  SELECT EXISTS(
    SELECT 1 
    FROM auth.users 
    WHERE email = user_email
  ) INTO user_exists;
  
  RETURN user_exists;
END;
$$;

-- Função para criar/atualizar usuário barbeiro com acesso administrativo
CREATE OR REPLACE FUNCTION public.create_barber_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_staff_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  result JSON;
BEGIN
  -- Verificar se o usuário já existe
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF user_id IS NOT NULL THEN
    -- Usuário existe, atualizar senha
    UPDATE auth.users 
    SET 
      encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = now()
    WHERE id = user_id;
    
    result := json_build_object(
      'success', true,
      'action', 'updated',
      'user_id', user_id,
      'message', 'Senha atualizada com sucesso'
    );
  ELSE
    -- Criar novo usuário
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      json_build_object('name', p_name, 'role', 'barber'),
      'authenticated',
      'authenticated'
    ) RETURNING id INTO user_id;
    
    -- Criar role de barbeiro
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id, 'barber'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    result := json_build_object(
      'success', true,
      'action', 'created',
      'user_id', user_id,
      'message', 'Usuário criado com sucesso'
    );
  END IF;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Erro ao processar usuário'
  );
END;
$$;

-- Função para desabilitar usuário barbeiro
CREATE OR REPLACE FUNCTION public.disable_barber_user(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  result JSON;
BEGIN
  -- Encontrar o usuário
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF user_id IS NOT NULL THEN
    -- Remover roles de barbeiro
    DELETE FROM public.user_roles
    WHERE user_id = user_id AND role = 'barber'::app_role;
    
    -- Marcar usuário como inativo (opcional - depende da implementação)
    -- UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id = user_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Usuário desabilitado com sucesso'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Usuário não encontrado'
    );
  END IF;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Erro ao desabilitar usuário'
  );
END;
$$;

-- Conceder permissões de execução
GRANT EXECUTE ON FUNCTION public.check_auth_user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_barber_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_barber_user TO authenticated;
