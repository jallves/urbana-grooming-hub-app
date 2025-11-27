-- Função para limpar sessão específica por ID
CREATE OR REPLACE FUNCTION cleanup_session_by_id(p_session_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false,
      last_activity_at = NOW(),
      logout_at = NOW()
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$$;

-- Função para forçar limpeza de sessões do próprio admin
CREATE OR REPLACE FUNCTION cleanup_my_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  -- Buscar email do admin atual
  SELECT email INTO v_admin_email
  FROM admin_users
  WHERE user_id = auth.uid();
  
  -- Marcar todas as sessões do admin como inativas
  UPDATE user_sessions
  SET is_active = false,
      last_activity_at = NOW(),
      logout_at = NOW()
  WHERE user_email = v_admin_email
    AND is_active = true;
  
  RAISE NOTICE 'Sessões do admin % foram limpas', v_admin_email;
END;
$$;

COMMENT ON FUNCTION cleanup_session_by_id(UUID) IS 'Marca uma sessão específica como inativa';
COMMENT ON FUNCTION cleanup_my_sessions() IS 'Limpa todas as sessões do admin atual (útil para resolver sessões presas)';