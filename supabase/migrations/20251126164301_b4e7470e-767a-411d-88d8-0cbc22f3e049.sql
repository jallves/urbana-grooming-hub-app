
-- Criar função para invalidar todas as sessões ativas
CREATE OR REPLACE FUNCTION public.invalidate_all_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Invalidar todas as sessões na tabela user_sessions
  UPDATE public.user_sessions
  SET 
    is_active = FALSE,
    logout_at = NOW()
  WHERE is_active = TRUE;
  
  RAISE NOTICE 'Todas as sessões foram invalidadas';
END;
$$;

-- Executar a função para invalidar todas as sessões agora
SELECT public.invalidate_all_sessions();
