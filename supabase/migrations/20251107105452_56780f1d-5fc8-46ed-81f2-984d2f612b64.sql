-- =====================================================
-- MÓDULO FINANCEIRO ERP COMPLETO
-- Sistema unificado de gestão financeira
-- =====================================================

-- 1. ENUMS para padronização de status
CREATE TYPE transaction_status AS ENUM (
  'pending',      -- Pendente
  'processing',   -- Processando
  'completed',    -- Concluído
  'cancelled',    -- Cancelado
  'failed'        -- Falhou
);

CREATE TYPE payment_status AS ENUM (
  'pending',      -- Aguardando pagamento
  'processing',   -- Processando
  'paid',         -- Pago
  'partially_paid', -- Parcialmente pago
  'refunded',     -- Reembolsado
  'cancelled'     -- Cancelado
);

CREATE TYPE payment_method AS ENUM (
  'cash',         -- Dinheiro
  'credit_card',  -- Cartão de crédito
  'debit_card',   -- Cartão de débito
  'pix',          -- PIX
  'bank_transfer' -- Transferência bancária
);

CREATE TYPE transaction_type AS ENUM (
  'revenue',      -- Receita
  'expense',      -- Despesa
  'commission',   -- Comissão
  'refund',       -- Reembolso
  'adjustment'    -- Ajuste
);

-- 2. Tabela principal de registros financeiros (ERP)
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação única da transação
  transaction_number TEXT UNIQUE NOT NULL,
  
  -- Tipo e categoria
  transaction_type transaction_type NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Valores
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Status
  status transaction_status NOT NULL DEFAULT 'pending',
  
  -- Descrição
  description TEXT NOT NULL,
  notes TEXT,
  
  -- Datas
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Relações
  appointment_id UUID REFERENCES painel_agendamentos(id),
  client_id UUID REFERENCES painel_clientes(id),
  barber_id UUID REFERENCES staff(id),
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  -- Controle
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de itens da transação (serviços + produtos)
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relação com registro financeiro
  financial_record_id UUID NOT NULL REFERENCES financial_records(id) ON DELETE CASCADE,
  
  -- Tipo de item
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product', 'extra')),
  
  -- Referência ao item
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  
  -- Valores
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de registros de pagamento
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Número único de pagamento
  payment_number TEXT UNIQUE NOT NULL,
  
  -- Relação com registro financeiro
  financial_record_id UUID NOT NULL REFERENCES financial_records(id),
  
  -- Método e valor
  payment_method payment_method NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  
  -- Status
  status payment_status NOT NULL DEFAULT 'pending',
  
  -- Informações do pagamento
  transaction_id TEXT, -- ID da transação externa (PIX, cartão, etc)
  authorization_code TEXT,
  pix_qr_code TEXT,
  pix_key TEXT,
  
  -- Datas
  payment_date TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para performance
CREATE INDEX idx_financial_records_transaction_number ON financial_records(transaction_number);
CREATE INDEX idx_financial_records_date ON financial_records(transaction_date);
CREATE INDEX idx_financial_records_status ON financial_records(status);
CREATE INDEX idx_financial_records_type ON financial_records(transaction_type);
CREATE INDEX idx_financial_records_appointment ON financial_records(appointment_id);
CREATE INDEX idx_financial_records_client ON financial_records(client_id);
CREATE INDEX idx_financial_records_barber ON financial_records(barber_id);

CREATE INDEX idx_transaction_items_financial_record ON transaction_items(financial_record_id);
CREATE INDEX idx_transaction_items_item_id ON transaction_items(item_id);

CREATE INDEX idx_payment_records_financial_record ON payment_records(financial_record_id);
CREATE INDEX idx_payment_records_payment_number ON payment_records(payment_number);
CREATE INDEX idx_payment_records_status ON payment_records(status);
CREATE INDEX idx_payment_records_method ON payment_records(payment_method);

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_financial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER financial_records_updated_at
  BEFORE UPDATE ON financial_records
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER payment_records_updated_at
  BEFORE UPDATE ON payment_records
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_updated_at();

-- 7. Function para gerar número de transação único
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Formato: TRX-YYYYMMDD-XXXXXX
    new_number := 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                  LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM financial_records WHERE transaction_number = new_number) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 8. Function para gerar número de pagamento único
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Formato: PAY-YYYYMMDD-XXXXXX
    new_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                  LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM payment_records WHERE payment_number = new_number) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 9. View para dashboard financeiro
CREATE OR REPLACE VIEW financial_dashboard AS
SELECT 
  DATE_TRUNC('month', transaction_date) as period,
  transaction_type,
  category,
  SUM(net_amount) as total_amount,
  COUNT(*) as transaction_count,
  AVG(net_amount) as average_amount
FROM financial_records
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', transaction_date), transaction_type, category;

-- 10. View para relatório de comissões
CREATE OR REPLACE VIEW commission_report AS
SELECT 
  fr.barber_id,
  s.name as barber_name,
  s.email as barber_email,
  DATE_TRUNC('month', fr.transaction_date) as period,
  COUNT(fr.id) as total_services,
  SUM(fr.net_amount) as total_commission,
  AVG(s.commission_rate) as average_rate,
  fr.status
FROM financial_records fr
JOIN staff s ON fr.barber_id = s.id
WHERE fr.transaction_type = 'commission'
GROUP BY fr.barber_id, s.name, s.email, DATE_TRUNC('month', fr.transaction_date), fr.status;

-- 11. RLS Policies
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Admins podem tudo
CREATE POLICY "Admins can manage financial_records" ON financial_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage transaction_items" ON transaction_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage payment_records" ON payment_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Barbeiros podem ver suas próprias comissões
CREATE POLICY "Barbers can view own financial records" ON financial_records
  FOR SELECT USING (
    barber_id IN (
      SELECT id FROM staff WHERE email = auth.email() AND is_active = true
    )
  );

-- Sistema pode inserir
CREATE POLICY "System can insert financial_records" ON financial_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert transaction_items" ON transaction_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert payment_records" ON payment_records
  FOR INSERT WITH CHECK (true);

-- 12. Atualizar status de agendamento para usar enum padrão
ALTER TABLE painel_agendamentos 
  DROP CONSTRAINT IF EXISTS painel_agendamentos_status_check;

ALTER TABLE painel_agendamentos 
  ADD CONSTRAINT painel_agendamentos_status_check 
  CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado'));

COMMENT ON TABLE financial_records IS 'Registro principal de todas transações financeiras do sistema ERP';
COMMENT ON TABLE transaction_items IS 'Itens detalhados de cada transação (serviços + produtos)';
COMMENT ON TABLE payment_records IS 'Registros de pagamentos vinculados às transações financeiras';