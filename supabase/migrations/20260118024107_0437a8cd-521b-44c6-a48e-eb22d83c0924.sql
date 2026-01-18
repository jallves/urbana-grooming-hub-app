-- Adicionar coluna transaction_id em contas_receber para rastreio de transações eletrônicas (NSU/PIX)
ALTER TABLE public.contas_receber 
ADD COLUMN IF NOT EXISTS transaction_id TEXT NULL;

-- Criar índice para buscas por transaction_id
CREATE INDEX IF NOT EXISTS idx_contas_receber_transaction_id 
ON public.contas_receber(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.contas_receber.transaction_id IS 'ID da transação eletrônica (NSU PayGo, código PIX, etc.) para rastreio de pagamentos';