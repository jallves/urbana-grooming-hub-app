-- Função para limpar sessões inativas e expiradas
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS TABLE(
  sessions_cleaned integer,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer;
  inactive_count integer;
BEGIN
  -- Invalidar sessões expiradas
  UPDATE public.user_sessions
  SET 
    is_active = false,
    logout_at = NOW()
  WHERE is_active = true
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Invalidar sessões inativas (sem atividade há mais de 2 horas)
  UPDATE public.user_sessions
  SET 
    is_active = false,
    logout_at = NOW()
  WHERE is_active = true
    AND last_activity_at < NOW() - INTERVAL '2 hours';
  
  GET DIAGNOSTICS inactive_count = ROW_COUNT;
  
  -- Limpar sessões antigas de clientes (expiradas)
  DELETE FROM public.client_sessions
  WHERE expires_at < NOW();
  
  sessions_cleaned := expired_count + inactive_count;
  details := jsonb_build_object(
    'expired_sessions', expired_count,
    'inactive_sessions', inactive_count,
    'total_cleaned', sessions_cleaned
  );
  
  RETURN QUERY SELECT sessions_cleaned, details;
END;
$$;

-- Executar limpeza imediata
SELECT * FROM public.cleanup_inactive_sessions();