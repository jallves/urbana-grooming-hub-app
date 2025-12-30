-- Adicionar campos para suporte a transações pendentes (Passos 33/34 Homologação PayGo)
-- Estes campos permitem rastrear transações que requerem confirmação/desfazimento

ALTER TABLE public.tef_mock_transactions 
ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmation_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS pending_transaction_exists BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN public.tef_mock_transactions.requires_confirmation IS 'Indica se a transação requer confirmação manual (CONFIRMADO_MANUAL ou DESFEITO_MANUAL)';
COMMENT ON COLUMN public.tef_mock_transactions.confirmation_transaction_id IS 'ID de confirmação recebido do PayGo para enviar confirmação/desfazimento';
COMMENT ON COLUMN public.tef_mock_transactions.pending_transaction_exists IS 'Indica se existe transação pendente que bloqueia novas vendas';