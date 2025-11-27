-- Função para limpar completamente todas as sessões (uso administrativo)
CREATE OR REPLACE FUNCTION cleanup_all_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marcar todas as sessões como inativas
  UPDATE user_sessions
  SET is_active = false,
      last_activity_at = NOW()
  WHERE is_active = true;
  
  RAISE NOTICE 'Todas as sessões foram marcadas como inativas';
END;
$$;

-- Função para limpar sessões de um tipo específico
CREATE OR REPLACE FUNCTION cleanup_sessions_by_type(p_user_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marcar sessões do tipo especificado como inativas
  UPDATE user_sessions
  SET is_active = false,
      last_activity_at = NOW()
  WHERE is_active = true
    AND user_type = p_user_type;
  
  RAISE NOTICE 'Sessões do tipo % foram marcadas como inativas', p_user_type;
END;
$$;

-- Comentários das funções
COMMENT ON FUNCTION cleanup_all_sessions() IS 'Marca todas as sessões ativas como inativas (uso administrativo emergencial)';
COMMENT ON FUNCTION cleanup_sessions_by_type(TEXT) IS 'Marca todas as sessões de um tipo específico como inativas';