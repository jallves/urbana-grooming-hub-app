-- Criar tabela para transações TEF mock
CREATE TABLE public.tef_mock_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  terminal_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('credit', 'debit', 'pix')),
  installments INTEGER DEFAULT 1,
  callback_url TEXT,
  reference TEXT,
  soft_descriptor TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'approved', 'declined', 'canceled', 'expired')),
  authorization_code TEXT,
  nsu TEXT,
  card_brand TEXT,
  simulated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_tef_mock_payment_id ON public.tef_mock_transactions(payment_id);
CREATE INDEX idx_tef_mock_status ON public.tef_mock_transactions(status);
CREATE INDEX idx_tef_mock_reference ON public.tef_mock_transactions(reference);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tef_mock_updated_at
  BEFORE UPDATE ON public.tef_mock_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.tef_mock_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Admin pode ver tudo
CREATE POLICY "Admins podem gerenciar transações TEF mock"
  ON public.tef_mock_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Criar tabela de configurações TEF
CREATE TABLE public.tef_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  use_mock BOOLEAN NOT NULL DEFAULT true,
  terminal_id TEXT,
  api_url TEXT,
  api_key TEXT,
  webhook_url TEXT,
  timeout_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir configuração padrão (mock ativado)
INSERT INTO public.tef_settings (use_mock, terminal_id, api_url)
VALUES (true, 'TESTE-0001', 'https://bqftkknbvmggcbsubicl.supabase.co/functions/v1/tef-mock');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tef_settings_updated_at
  BEFORE UPDATE ON public.tef_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.tef_settings ENABLE ROW LEVEL SECURITY;

-- Política: Admin pode gerenciar configurações
CREATE POLICY "Admins podem gerenciar configurações TEF"
  ON public.tef_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Habilitar realtime para transações TEF
ALTER PUBLICATION supabase_realtime ADD TABLE public.tef_mock_transactions;