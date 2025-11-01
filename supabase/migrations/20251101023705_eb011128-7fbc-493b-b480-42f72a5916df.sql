-- Criar enum para status de agendamento
CREATE TYPE status_agendamento AS ENUM (
  'AGENDADO','CHEGOU','EM_ATENDIMENTO','FINALIZADO','CANCELADO'
);

-- Adicionar campos ao agendamentos (painel_agendamentos)
ALTER TABLE painel_agendamentos 
ADD COLUMN IF NOT EXISTS qr_checkin TEXT,
ADD COLUMN IF NOT EXISTS status_totem status_agendamento DEFAULT 'AGENDADO';

-- Criar tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID REFERENCES painel_agendamentos(id),
  cliente_id UUID REFERENCES painel_clientes(id),
  barbeiro_id UUID REFERENCES staff(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ABERTA', -- ABERTA, PAGA, ESTORNADA
  criado_em TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de itens de venda
CREATE TABLE IF NOT EXISTS vendas_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'SERVICO' | 'PRODUTO'
  ref_id UUID NOT NULL, -- servico_id ou produto_id
  nome TEXT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  preco_unit NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de pagamentos (mais completa)
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL, -- PIX | CARTAO_DEBITO | CARTAO_CREDITO
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE', -- PENDENTE | APROVADO | FALHOU | ESTORNADO
  provedor TEXT, -- PSP/adquirente
  transacao_id TEXT UNIQUE,
  payload JSONB,
  qr_code TEXT, -- para PIX
  copia_cola TEXT, -- para PIX
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de produtos (caso não exista)
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  estoque INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_agendamento ON vendas(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_venda ON pagamentos(venda_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_transacao ON pagamentos(transacao_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- RLS Policies para vendas
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Totem pode criar vendas"
  ON vendas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Totem pode ler vendas"
  ON vendas FOR SELECT
  USING (true);

CREATE POLICY "Totem pode atualizar vendas"
  ON vendas FOR UPDATE
  USING (true);

-- RLS Policies para vendas_itens
ALTER TABLE vendas_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Totem pode gerenciar itens"
  ON vendas_itens FOR ALL
  USING (true);

-- RLS Policies para pagamentos
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Totem pode gerenciar pagamentos"
  ON pagamentos FOR ALL
  USING (true);

-- RLS Policies para produtos
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Totem pode ler produtos"
  ON produtos FOR SELECT
  USING (ativo = true);

-- Função para gerar QR Code assinado
CREATE OR REPLACE FUNCTION generate_qr_checkin(p_agendamento_id UUID, p_secret TEXT)
RETURNS TEXT AS $$
DECLARE
  payload JSONB;
  exp_timestamp BIGINT;
  signature TEXT;
BEGIN
  -- Expiração: final do dia do agendamento
  SELECT EXTRACT(EPOCH FROM (data + INTERVAL '1 day'))::BIGINT INTO exp_timestamp
  FROM painel_agendamentos WHERE id = p_agendamento_id;
  
  payload := jsonb_build_object(
    'agendamento_id', p_agendamento_id,
    'exp', exp_timestamp
  );
  
  -- Gerar assinatura HMAC-SHA256
  signature := encode(
    hmac(payload::text, p_secret, 'sha256'),
    'hex'
  );
  
  payload := payload || jsonb_build_object('sig', signature);
  
  RETURN payload::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar QR Code
CREATE OR REPLACE FUNCTION validate_qr_checkin(p_qr_token TEXT, p_secret TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  payload JSONB;
  exp_timestamp BIGINT;
  provided_sig TEXT;
  calculated_sig TEXT;
  payload_without_sig JSONB;
BEGIN
  payload := p_qr_token::JSONB;
  
  -- Verificar expiração
  exp_timestamp := (payload->>'exp')::BIGINT;
  IF exp_timestamp < EXTRACT(EPOCH FROM now()) THEN
    RETURN false;
  END IF;
  
  -- Extrair assinatura fornecida
  provided_sig := payload->>'sig';
  
  -- Remover assinatura do payload para recalcular
  payload_without_sig := payload - 'sig';
  
  -- Calcular assinatura
  calculated_sig := encode(
    hmac(payload_without_sig::text, p_secret, 'sha256'),
    'hex'
  );
  
  -- Comparar assinaturas
  RETURN provided_sig = calculated_sig;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();