
-- Criar tabela para controle de sessões do caixa
CREATE TABLE public.cash_register_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(10,2),
  total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_commissions NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Criar índices para performance
CREATE INDEX idx_cash_register_sessions_date ON public.cash_register_sessions(date);
CREATE INDEX idx_cash_register_sessions_status ON public.cash_register_sessions(status);

-- Habilitar RLS
ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;

-- Política RLS - apenas admins podem acessar
CREATE POLICY "Admins can manage cash register sessions" ON public.cash_register_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cash_register_sessions_updated_at 
  BEFORE UPDATE ON public.cash_register_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
