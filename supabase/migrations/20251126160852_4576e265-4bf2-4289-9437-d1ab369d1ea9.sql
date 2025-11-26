-- Criar tabela para controle de sessões de todos os usuários
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'barber', 'client', 'painel_cliente', 'totem')),
  user_email TEXT,
  user_name TEXT,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  logout_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_user_type ON public.user_sessions(user_type);
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at_trigger
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_updated_at();

-- Habilitar RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Admins podem ver todas as sessões
CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'master')
    )
  );

-- Usuários podem ver suas próprias sessões
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Sistema pode inserir sessões (SECURITY DEFINER functions)
CREATE POLICY "System can insert sessions"
  ON public.user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sistema pode atualizar sessões
CREATE POLICY "System can update sessions"
  ON public.user_sessions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Admins podem deletar sessões
CREATE POLICY "Admins can delete sessions"
  ON public.user_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'master')
    )
  );

-- Função para criar sessão
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id UUID,
  p_user_type TEXT,
  p_user_email TEXT,
  p_user_name TEXT,
  p_session_token TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Definir expiração padrão de 24 horas se não fornecido
  v_expires_at := COALESCE(p_expires_at, NOW() + INTERVAL '24 hours');
  
  -- Invalidar sessões anteriores ativas do mesmo usuário e tipo
  UPDATE public.user_sessions
  SET is_active = FALSE, logout_at = NOW()
  WHERE user_id = p_user_id
    AND user_type = p_user_type
    AND is_active = TRUE;
  
  -- Criar nova sessão
  INSERT INTO public.user_sessions (
    user_id,
    user_type,
    user_email,
    user_name,
    session_token,
    ip_address,
    user_agent,
    device_info,
    expires_at
  ) VALUES (
    p_user_id,
    p_user_type,
    p_user_email,
    p_user_name,
    p_session_token,
    p_ip_address,
    p_user_agent,
    p_device_info,
    v_expires_at
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

-- Função para atualizar atividade da sessão
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_sessions
  SET last_activity_at = NOW()
  WHERE session_token = p_session_token
    AND is_active = TRUE
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$;

-- Função para invalidar sessão
CREATE OR REPLACE FUNCTION public.invalidate_session(p_session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_sessions
  SET is_active = FALSE, logout_at = NOW()
  WHERE session_token = p_session_token
    AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$;

-- Função para validar sessão
CREATE OR REPLACE FUNCTION public.validate_session(p_session_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM public.user_sessions
  WHERE session_token = p_session_token
    AND is_active = TRUE
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;
  
  -- Atualizar última atividade
  PERFORM public.update_session_activity(p_session_token);
  
  RETURN jsonb_build_object(
    'valid', true,
    'session_id', v_session.id,
    'user_id', v_session.user_id,
    'user_type', v_session.user_type,
    'user_email', v_session.user_email,
    'user_name', v_session.user_name
  );
END;
$$;

-- Função para obter todas as sessões ativas
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
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role IN ('admin', 'master')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem visualizar todas as sessões';
  END IF;
  
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
  FROM public.user_sessions s
  WHERE s.is_active = TRUE
    AND s.expires_at > NOW()
  ORDER BY s.last_activity_at DESC;
END;
$$;

-- Função para forçar logout de sessão (apenas admins)
CREATE OR REPLACE FUNCTION public.force_logout_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND role IN ('admin', 'master')
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem forçar logout';
  END IF;
  
  UPDATE public.user_sessions
  SET is_active = FALSE, logout_at = NOW()
  WHERE id = p_session_id
    AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$;

-- Função para limpar sessões expiradas (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  UPDATE public.user_sessions
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;