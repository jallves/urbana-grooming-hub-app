-- Criar tabela para armazenar tokens de push notification
CREATE TABLE public.push_notification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES painel_clientes(id) ON DELETE CASCADE,
  subscription_data JSONB NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(client_id, subscription_data)
);

-- Habilitar RLS
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Clientes podem ver seus próprios tokens"
ON public.push_notification_tokens
FOR SELECT
USING (client_id IN (
  SELECT id FROM painel_clientes 
  WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
));

CREATE POLICY "Clientes podem inserir seus próprios tokens"
ON public.push_notification_tokens
FOR INSERT
WITH CHECK (client_id IN (
  SELECT id FROM painel_clientes 
  WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
));

CREATE POLICY "Clientes podem atualizar seus próprios tokens"
ON public.push_notification_tokens
FOR UPDATE
USING (client_id IN (
  SELECT id FROM painel_clientes 
  WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
));

CREATE POLICY "Clientes podem deletar seus próprios tokens"
ON public.push_notification_tokens
FOR DELETE
USING (client_id IN (
  SELECT id FROM painel_clientes 
  WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
));

-- Criar tabela para log de notificações enviadas
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES painel_agendamentos(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES painel_clientes(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('24h_before', '4h_before')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
  error_message TEXT,
  metadata JSONB,
  UNIQUE(appointment_id, notification_type)
);

-- Habilitar RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Clientes podem ver seus próprios logs"
ON public.notification_logs
FOR SELECT
USING (client_id IN (
  SELECT id FROM painel_clientes 
  WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
));

-- Índices para performance
CREATE INDEX idx_push_tokens_client_id ON push_notification_tokens(client_id);
CREATE INDEX idx_push_tokens_active ON push_notification_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_notification_logs_appointment ON notification_logs(appointment_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON push_notification_tokens
FOR EACH ROW
EXECUTE FUNCTION update_push_tokens_updated_at();