-- Migração: Atualizar forma_pagamento em contas_receber e contas_pagar
-- baseando-se na tabela vendas (que já tem forma_pagamento)

-- 1. Atualizar contas_receber que têm transaction_id correspondente na vendas
UPDATE contas_receber cr
SET forma_pagamento = v.forma_pagamento
FROM vendas v
WHERE cr.forma_pagamento IS NULL
  AND cr.transaction_id IS NOT NULL
  AND v.id::text = cr.transaction_id;

-- 2. Atualizar contas_receber via observacoes que contêm o venda_id
UPDATE contas_receber cr
SET forma_pagamento = v.forma_pagamento
FROM vendas v
WHERE cr.forma_pagamento IS NULL
  AND cr.observacoes LIKE '%id=' || v.id::text || '%';

-- 3. Atualizar contas_pagar que têm transaction_id correspondente na vendas
UPDATE contas_pagar cp
SET forma_pagamento = v.forma_pagamento
FROM vendas v
WHERE cp.forma_pagamento IS NULL
  AND cp.transaction_id IS NOT NULL
  AND v.id::text = cp.transaction_id;

-- 4. Atualizar contas_pagar via observacoes que contêm o venda_id
UPDATE contas_pagar cp
SET forma_pagamento = v.forma_pagamento
FROM vendas v
WHERE cp.forma_pagamento IS NULL
  AND cp.observacoes LIKE '%id=' || v.id::text || '%';

-- 5. Atualizar financial_records que têm reference_id correspondente na vendas
UPDATE financial_records fr
SET payment_method = v.forma_pagamento
FROM vendas v
WHERE fr.payment_method IS NULL
  AND fr.reference_id IS NOT NULL
  AND v.id = fr.reference_id;