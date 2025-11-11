-- Adicionar coluna payment_date na tabela financial_records para registrar quando foi pago
ALTER TABLE financial_records 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance em queries por data de pagamento
CREATE INDEX IF NOT EXISTS idx_financial_records_payment_date 
ON financial_records(payment_date);

-- Comentário na coluna
COMMENT ON COLUMN financial_records.payment_date IS 'Data em que a transação foi efetivamente paga/recebida';
