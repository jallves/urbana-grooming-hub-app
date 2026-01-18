-- Adicionar transaction_id na tabela contas_pagar para rastreio de transações eletrônicas
ALTER TABLE public.contas_pagar
ADD COLUMN IF NOT EXISTS transaction_id TEXT NULL;

-- Índice para buscas rápidas por transaction_id
CREATE INDEX IF NOT EXISTS idx_contas_pagar_transaction_id
ON public.contas_pagar(transaction_id) WHERE transaction_id IS NOT NULL;

-- Atualizar categorias existentes de inglês para português
UPDATE public.contas_receber SET categoria = 'servico' WHERE categoria = 'services';
UPDATE public.contas_receber SET categoria = 'produto' WHERE categoria = 'products';
UPDATE public.contas_receber SET categoria = 'gorjeta' WHERE categoria = 'tips';

UPDATE public.contas_pagar SET categoria = 'comissao' WHERE categoria = 'staff_payments';
UPDATE public.contas_pagar SET categoria = 'produto' WHERE categoria = 'products';
UPDATE public.contas_pagar SET categoria = 'gorjeta' WHERE categoria = 'tips';

-- Comentários para documentação
COMMENT ON COLUMN public.contas_pagar.transaction_id IS 'ID da transação eletrônica (NSU PayGo, código PIX) para conciliação';
COMMENT ON COLUMN public.contas_receber.transaction_id IS 'ID da transação eletrônica (NSU PayGo, código PIX) para conciliação';