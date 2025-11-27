-- CORREÇÃO CRÍTICA: Função auto_create_user_session() estava causando falha de autenticação
-- Problema: ON CONFLICT usava (user_id, session_token) mas só session_token tem constraint única

CREATE OR REPLACE FUNCTION public.auto_create_user_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_type TEXT;
  v_user_name TEXT;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Só criar sessão quando houver novo login (last_sign_in_at mudou)
  IF NEW.last_sign_in_at IS NOT NULL AND (OLD.last_sign_in_at IS NULL OR OLD.last_sign_in_at != NEW.last_sign_in_at) THEN
    
    -- Buscar tipo de usuário
    SELECT role INTO v_user_type 
    FROM public.user_roles 
    WHERE user_id = NEW.id 
    LIMIT 1;
    
    v_user_type := COALESCE(v_user_type, 'user');
    v_user_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      NEW.email
    );
    
    -- Gerar token único
    v_session_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + INTERVAL '7 days';
    
    -- CORREÇÃO: usar apenas session_token no ON CONFLICT (pois só ele tem constraint UNIQUE)
    INSERT INTO public.user_sessions (
      user_id, 
      user_type, 
      user_email, 
      user_name, 
      session_token, 
      ip_address, 
      user_agent, 
      login_at, 
      last_activity_at, 
      expires_at, 
      is_active
    )
    VALUES (
      NEW.id, 
      v_user_type, 
      NEW.email, 
      v_user_name, 
      v_session_token, 
      public.get_client_ip(), 
      current_setting('request.headers', true)::json->>'user-agent', 
      NOW(), 
      NOW(), 
      v_expires_at, 
      TRUE
    )
    ON CONFLICT (session_token) DO UPDATE SET 
      last_activity_at = NOW(), 
      is_active = TRUE, 
      logout_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;