-- ==========================================
-- SISTEMA DE INVALIDAÇÃO DE SESSÕES EM TEMPO REAL
-- ==========================================

-- 1. Tabela para notificações de logout forçado
CREATE TABLE IF NOT EXISTS public.force_logout_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  reason TEXT,
  forced_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.force_logout_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logout notifications"
  ON public.force_logout_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert logout notifications"
  ON public.force_logout_notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master', 'admin')
    )
  );

-- 2. Função para forçar logout de usuário
CREATE OR REPLACE FUNCTION public.force_user_logout(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_sessions_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('master', 'admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  UPDATE public.user_sessions SET is_active = FALSE, logout_at = NOW(), updated_at = NOW() WHERE user_id = p_user_id AND is_active = TRUE;
  GET DIAGNOSTICS v_sessions_count = ROW_COUNT;

  INSERT INTO public.force_logout_notifications (user_id, user_email, reason, forced_by)
  VALUES (p_user_id, v_user_email, p_reason, auth.uid());

  RETURN jsonb_build_object('success', TRUE, 'user_email', v_user_email, 'sessions_invalidated', v_sessions_count);
END;
$$;

-- 3. Função para marcar notificação como processada
CREATE OR REPLACE FUNCTION public.mark_logout_notification_processed(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.force_logout_notifications SET processed = TRUE, processed_at = NOW() WHERE id = p_notification_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_force_logout_user_id ON public.force_logout_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_force_logout_processed ON public.force_logout_notifications(processed) WHERE processed = FALSE;