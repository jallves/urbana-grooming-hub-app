-- Criar função para limpar logs com mais de 30 dias
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.admin_activity_log
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Logs de segurança com mais de 30 dias foram removidos';
END;
$$;

-- Criar índice para melhorar performance da limpeza e consultas
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at 
ON public.admin_activity_log(created_at DESC);

-- Criar índice para busca por admin
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id 
ON public.admin_activity_log(admin_id);

-- Criar índice para busca por entidade
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity 
ON public.admin_activity_log(entity);