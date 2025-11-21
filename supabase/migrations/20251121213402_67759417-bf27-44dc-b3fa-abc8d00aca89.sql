
-- =====================================================
-- OTIMIZAÇÃO DE PERFORMANCE DO PAINEL ADMIN
-- =====================================================

-- 1. Criar índices compostos para queries do ERP Financeiro
CREATE INDEX IF NOT EXISTS idx_financial_records_type_date_status 
ON financial_records(transaction_type, transaction_date DESC, status);

CREATE INDEX IF NOT EXISTS idx_financial_records_type_created 
ON financial_records(transaction_type, created_at DESC);

-- 2. Criar índice para joins com payment_records
CREATE INDEX IF NOT EXISTS idx_payment_records_financial_date 
ON payment_records(financial_record_id, payment_date DESC);

-- 3. Criar índice para barber_commissions com status
CREATE INDEX IF NOT EXISTS idx_barber_commissions_status_created 
ON barber_commissions(status, created_at DESC);

-- 4. Otimizar queries de staff com joins
CREATE INDEX IF NOT EXISTS idx_staff_user_active 
ON staff(user_id, is_active) WHERE user_id IS NOT NULL;

-- 5. Adicionar estatísticas nas tabelas principais
ANALYZE financial_records;
ANALYZE payment_records;
ANALYZE barber_commissions;
ANALYZE staff;
ANALYZE cash_flow;

COMMENT ON INDEX idx_financial_records_type_date_status IS 
'Índice composto para otimizar queries de Contas a Receber e Contas a Pagar que filtram por tipo, ordenam por data e filtram por status';

COMMENT ON INDEX idx_financial_records_type_created IS 
'Índice composto para queries que filtram por tipo e ordenam por data de criação';

COMMENT ON INDEX idx_payment_records_financial_date IS 
'Índice para otimizar joins entre financial_records e payment_records';

COMMENT ON INDEX idx_barber_commissions_status_created IS 
'Índice para queries de comissões que filtram por status e ordenam por data';
