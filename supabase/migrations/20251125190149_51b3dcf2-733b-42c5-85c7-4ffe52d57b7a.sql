-- ====================================================================
-- SOLUÇÃO ROBUSTA: Função SECURITY DEFINER para criar perfil do cliente
-- ====================================================================
-- Esta função bypassa RLS de forma segura e controlada
-- Só pode ser usada logo após criar usuário no auth.users

CREATE OR REPLACE FUNCTION public.create_client_profile_after_signup(
  p_user_id UUID,
  p_nome TEXT,
  p_whatsapp TEXT,
  p_data_nascimento DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_whatsapp UUID;
  v_existing_profile UUID;
BEGIN
  -- 🔒 VALIDAÇÃO 1: Verificar se o user_id existe no auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado no sistema de autenticação'
    );
  END IF;

  -- 🔒 VALIDAÇÃO 2: Verificar se já existe perfil para este usuário
  SELECT id INTO v_existing_profile
  FROM public.client_profiles
  WHERE id = p_user_id;

  IF v_existing_profile IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Perfil já existe para este usuário'
    );
  END IF;

  -- 🔒 VALIDAÇÃO 3: Verificar WhatsApp duplicado (última barreira)
  SELECT id INTO v_existing_whatsapp
  FROM public.client_profiles
  WHERE whatsapp = TRIM(p_whatsapp);

  IF v_existing_whatsapp IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '📱 Este número de WhatsApp já está cadastrado em nosso sistema!'
    );
  END IF;

  -- ✅ CRIAR PERFIL (bypassing RLS com SECURITY DEFINER)
  INSERT INTO public.client_profiles (
    id,
    nome,
    whatsapp,
    data_nascimento,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    TRIM(p_nome),
    TRIM(p_whatsapp),
    p_data_nascimento,
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Perfil criado com sucesso'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '📱 Este número de WhatsApp já está cadastrado por outro usuário'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Erro ao criar perfil: ' || SQLERRM
    );
END;
$$;

-- Comentário: Esta função é a ÚNICA forma segura de criar perfis de clientes
-- após o signup, pois bypassa RLS de forma controlada e com validações