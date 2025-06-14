
-- Criar tabela para entradas e saídas do fluxo de caixa
CREATE TABLE public.cash_flow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT,
  reference_id UUID, -- Para referenciar agendamentos, vendas, etc
  reference_type TEXT, -- 'appointment', 'product_sale', 'commission', etc
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para categorias de fluxo de caixa
CREATE TABLE public.cash_flow_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir categorias padrão
INSERT INTO public.cash_flow_categories (name, type, color, icon) VALUES
  ('Serviços de Barbearia', 'income', '#10B981', 'scissors'),
  ('Venda de Produtos', 'income', '#059669', 'shopping-bag'),
  ('Comissões', 'expense', '#F59E0B', 'users'),
  ('Aluguel', 'expense', '#EF4444', 'home'),
  ('Energia', 'expense', '#F97316', 'zap'),
  ('Internet', 'expense', '#8B5CF6', 'wifi'),
  ('Material de Limpeza', 'expense', '#06B6D4', 'spray-can'),
  ('Equipamentos', 'expense', '#6366F1', 'wrench'),
  ('Marketing', 'expense', '#EC4899', 'megaphone'),
  ('Outros', 'both', '#6B7280', 'more-horizontal');

-- Criar índices para performance
CREATE INDEX idx_cash_flow_date ON public.cash_flow(transaction_date);
CREATE INDEX idx_cash_flow_type ON public.cash_flow(transaction_type);
CREATE INDEX idx_cash_flow_category ON public.cash_flow(category);

-- Habilitar RLS
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas admins podem acessar
CREATE POLICY "Admins can manage cash flow" ON public.cash_flow
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage categories" ON public.cash_flow_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_cash_flow_updated_at 
  BEFORE UPDATE ON public.cash_flow 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flow_categories_updated_at 
  BEFORE UPDATE ON public.cash_flow_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
