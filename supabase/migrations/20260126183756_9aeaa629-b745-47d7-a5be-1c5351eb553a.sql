-- Adicionar coluna forma_pagamento nas tabelas contas_receber e contas_pagar
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS forma_pagamento text;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS forma_pagamento text;