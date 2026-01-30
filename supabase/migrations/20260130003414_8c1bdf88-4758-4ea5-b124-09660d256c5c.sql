-- Adicionar coluna payment_method à tabela financial_records
ALTER TABLE public.financial_records 
ADD COLUMN IF NOT EXISTS payment_method text;

-- Adicionar coluna forma_pagamento à tabela contas_receber (se não existir)
-- Já existe no schema, mas garantir que está sendo usada

-- Comentário para documentação
COMMENT ON COLUMN public.financial_records.payment_method IS 'Método de pagamento: credit_card, debit_card, pix, cash, bank_transfer';