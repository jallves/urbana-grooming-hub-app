-- ==========================================
-- CORREÇÃO: PREVENÇÃO DE DESLOGAMENTO AUTOMÁTICO
-- ==========================================

-- 1. Atualizar função de criação de sessão para 7 dias de expiração
CREATE OR REPLACE FUNCTION public.auto_create_user_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_user_name TEXT;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF NEW.last_sign_in_at IS NOT NULL AND (OLD.last_sign_in_at IS NULL OR OLD.last_sign_in_at != NEW.last_sign_in_at) THEN
    SELECT role INTO v_user_type FROM public.user_roles WHERE user_id = NEW.id LIMIT 1;
    v_user_type := COALESCE(v_user_type, 'user');
    v_user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);
    v_session_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + INTERVAL '7 days';
    
    INSERT INTO public.user_sessions (user_id, user_type, user_email, user_name, session_token, ip_address, user_agent, login_at, last_activity_at, expires_at, is_active)
    VALUES (NEW.id, v_user_type, NEW.email, v_user_name, v_session_token, public.get_client_ip(), current_setting('request.headers', true)::json->>'user-agent', NOW(), NOW(), v_expires_at, TRUE)
    ON CONFLICT (user_id, session_token) DO UPDATE SET last_activity_at = NOW(), is_active = TRUE, logout_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Atualizar função de limpeza de sessões
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cleaned_count INTEGER;
BEGIN
  UPDATE public.user_sessions SET is_active = FALSE, logout_at = NOW() WHERE is_active = TRUE AND expires_at < NOW();
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
END;
$$;

-- 3. Atualizar função de atividade
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions SET last_activity_at = NOW() WHERE session_token = p_session_token AND is_active = TRUE AND expires_at > NOW();
  RETURN FOUND;
END;
$$;

-- 4. Estender sessões ativas atuais para 7 dias
UPDATE public.user_sessions SET expires_at = NOW() + INTERVAL '7 days' WHERE is_active = TRUE AND expires_at < NOW() + INTERVAL '1 day';