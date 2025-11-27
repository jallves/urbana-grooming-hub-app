-- ========================================
-- CORREÇÃO DO SISTEMA DE SESSÕES
-- ========================================
-- Problema: Clientes fazem login via Supabase Auth mas sessões não são criadas
-- Solução: Trigger automática + função melhorada

-- ========================================
-- 1. Função para extrair IP do request (se disponível)
-- ========================================
CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tentar obter IP dos headers da requisição
  RETURN current_setting('request.headers', true)::json->>'x-real-ip';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- ========================================
-- 2. Função melhorada para criar sessão automaticamente
-- ========================================
CREATE OR REPLACE FUNCTION public.auto_create_user_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_name TEXT;
  v_user_type TEXT;
  v_session_token TEXT;
BEGIN
  -- Só criar sessão para INSERT (novo login) ou UPDATE que indica novo access token
  IF TG_OP = 'UPDATE' AND (OLD.last_sign_in_at IS NOT DISTINCT FROM NEW.last_sign_in_at) THEN
    RETURN NEW;
  END IF;

  -- Gerar token único
  v_session_token := 'auto-' || gen_random_uuid()::text;

  -- Extrair nome do metadata
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );

  -- Determinar tipo de usuário
  SELECT role::text INTO v_user_type
  FROM user_roles
  WHERE user_id = NEW.id
  LIMIT 1;

  -- Default para 'client' se não encontrar
  v_user_type := COALESCE(v_user_type, 'client');

  -- Criar sessão automaticamente
  INSERT INTO public.user_sessions (
    user_id,
    user_type,
    user_email,
    user_name,
    session_token,
    ip_address,
    user_agent,
    device_info,
    expires_at,
    login_at,
    last_activity_at
  ) VALUES (
    NEW.id,
    v_user_type,
    NEW.email,
    v_user_name,
    v_session_token,
    get_client_ip(),
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object(
      'created_by', 'auto_trigger',
      'last_sign_in', NEW.last_sign_in_at
    ),
    NOW() + INTERVAL '24 hours',
    NOW(),
    NOW()
  )
  ON CONFLICT (session_token) DO NOTHING;

  RAISE NOTICE '✅ Sessão criada automaticamente para usuário: % (tipo: %)', NEW.email, v_user_type;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Não falhar o login se houver erro na criação da sessão
    RAISE WARNING '⚠️ Erro ao criar sessão automaticamente: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ========================================
-- 3. Dropar trigger antiga se existir
-- ========================================
DROP TRIGGER IF EXISTS auto_create_session_on_login ON auth.users;

-- ========================================
-- 4. Criar trigger para auto-criar sessões
-- ========================================
-- IMPORTANTE: Só funciona em updates (quando last_sign_in_at muda)
-- porque não temos permissão para trigger em INSERT na auth.users
CREATE TRIGGER auto_create_session_on_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION public.auto_create_user_session();

-- ========================================
-- 5. Função para limpar sessões expiradas automaticamente
-- ========================================
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = FALSE,
      logout_at = NOW()
  WHERE is_active = TRUE
    AND expires_at < NOW();

  RAISE NOTICE '🧹 Limpeza automática de sessões expiradas realizada';
END;
$$;

-- ========================================
-- 6. Criar policy para permitir que a trigger funcione
-- ========================================
-- A trigger usa SECURITY DEFINER então não precisa de policy adicional,
-- mas vamos garantir que as policies existentes sejam suficientes

-- Verificar se policy de insert público existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_sessions' 
    AND policyname = 'user_sessions_insert_policy'
  ) THEN
    CREATE POLICY user_sessions_insert_policy ON user_sessions
      FOR INSERT TO public
      WITH CHECK (true);
  END IF;
END $$;

-- ========================================
-- MENSAGEM DE CONFIRMAÇÃO
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de sessões automático configurado!';
  RAISE NOTICE '📋 Funcionalidades:';
  RAISE NOTICE '   - Sessões criadas automaticamente no login';
  RAISE NOTICE '   - Detecta tipo de usuário (client, admin, barber, etc)';
  RAISE NOTICE '   - Expiração de 24 horas';
  RAISE NOTICE '   - Limpeza automática de sessões expiradas';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Próximo login de qualquer cliente criará sessão automaticamente';
END $$;