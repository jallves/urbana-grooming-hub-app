-- Função para invalidar sessão específica por email
CREATE OR REPLACE FUNCTION public.invalidate_user_session(p_user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_updated_count integer;
BEGIN
  UPDATE public.user_sessions
  SET 
    is_active = false,
    logout_at = NOW()
  WHERE user_email = p_user_email
    AND is_active = true;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  v_result := jsonb_build_object(
    'success', true,
    'email', p_user_email,
    'sessions_invalidated', v_updated_count,
    'message', format('Invalidadas %s sessões de %s', v_updated_count, p_user_email)
  );
  
  RETURN v_result;
END;
$$;

-- Invalidar a sessão travada de joao.colimoides@gmail.com
SELECT * FROM public.invalidate_user_session('joao.colimoides@gmail.com');