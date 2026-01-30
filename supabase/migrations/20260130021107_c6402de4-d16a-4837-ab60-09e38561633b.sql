-- =====================================================
-- TABELA DE SESSÕES ATIVAS
-- =====================================================

-- Criar tabela para gerenciar sessões ativas de usuários
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL DEFAULT 'user',
  user_email TEXT,
  user_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON public.active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON public.active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON public.active_sessions(last_activity_at);

-- Habilitar RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Admins can manage all sessions"
ON public.active_sessions
FOR ALL
USING (is_admin_or_higher(auth.uid()));

CREATE POLICY "Users can view own sessions"
ON public.active_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own sessions"
ON public.active_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own sessions"
ON public.active_sessions
FOR UPDATE
USING (user_id = auth.uid());

-- =====================================================
-- FUNÇÃO PARA REGISTRAR LOG DE ATIVIDADE
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_log_id UUID;
BEGIN
  -- Buscar admin_id pelo auth.uid()
  SELECT id INTO v_admin_id
  FROM public.admin_users
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Inserir log
  INSERT INTO public.admin_activity_log (
    admin_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) VALUES (
    v_admin_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA LIMPAR SESSÕES EXPIRADAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.active_sessions
  WHERE expires_at < now() OR (last_activity_at < now() - interval '2 hours' AND is_active = true);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA CRIAR SESSÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id UUID,
  p_user_type TEXT,
  p_user_email TEXT DEFAULT NULL,
  p_user_name TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL,
  p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Invalidar sessões antigas do mesmo usuário/tipo
  UPDATE public.active_sessions
  SET is_active = false
  WHERE user_id = p_user_id 
    AND user_type = p_user_type
    AND is_active = true;

  -- Criar nova sessão
  INSERT INTO public.active_sessions (
    user_id,
    user_type,
    user_email,
    user_name,
    ip_address,
    user_agent,
    device_info,
    expires_at
  ) VALUES (
    p_user_id,
    p_user_type,
    p_user_email,
    p_user_name,
    p_ip_address,
    p_user_agent,
    p_device_info,
    now() + (p_expires_in_hours || ' hours')::interval
  )
  RETURNING id INTO v_session_id;

  -- Log da ação
  PERFORM public.log_admin_activity(
    'login',
    'session',
    v_session_id,
    NULL,
    jsonb_build_object('user_email', p_user_email, 'user_type', p_user_type)
  );

  RETURN v_session_id;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR ATIVIDADE DA SESSÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.active_sessions
  SET last_activity_at = now()
  WHERE id = p_session_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA INVALIDAR SESSÃO (LOGOUT)
-- =====================================================

CREATE OR REPLACE FUNCTION public.invalidate_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM public.active_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.active_sessions
  SET is_active = false
  WHERE id = p_session_id;

  -- Log da ação
  PERFORM public.log_admin_activity(
    'logout',
    'session',
    p_session_id,
    jsonb_build_object('user_email', v_session.user_email),
    NULL
  );

  RETURN true;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA FORÇAR LOGOUT DE USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.force_logout_user(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.active_sessions
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log da ação
  PERFORM public.log_admin_activity(
    'logout',
    'user',
    p_user_id,
    NULL,
    jsonb_build_object('forced', true, 'sessions_closed', v_count)
  );

  RETURN v_count;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA OBTER SESSÕES ATIVAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_active_sessions()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_type TEXT,
  user_email TEXT,
  user_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  login_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar sessões expiradas primeiro
  PERFORM public.cleanup_expired_sessions();

  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.user_type,
    s.user_email,
    s.user_name,
    s.ip_address,
    s.user_agent,
    s.login_at,
    s.last_activity_at,
    s.expires_at
  FROM public.active_sessions s
  WHERE s.is_active = true
    AND s.expires_at > now()
  ORDER BY s.last_activity_at DESC;
END;
$$;