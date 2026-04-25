-- ════════════════════════════════════════════════════════════════════
-- CORREÇÃO: Combo Corte + Barba do Pedro Henrique Cosme (venda bc4c5df3)
-- Estado correto: 1× receita R$ 100 (combo) + 1× comissão R$ 40 (40%)
-- ════════════════════════════════════════════════════════════════════

-- 1) CONTAS A RECEBER: deletar os 2 lançamentos errados e criar 1 do combo
DELETE FROM contas_receber WHERE venda_id = 'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4';

INSERT INTO contas_receber (
  descricao, valor, status, cliente_id, categoria, venda_id,
  data_vencimento, data_recebimento, forma_pagamento, created_at
) VALUES (
  'Serviço: Combo Corte e Barba', 100.00, 'recebido',
  'e87fd875-7079-4045-a702-e176defb5c24', 'servico',
  'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4',
  '2026-04-25', '2026-04-25', 'CREDITO', '2026-04-25 15:38:48+00'
);

-- 2) CONTAS A PAGAR (comissões): deletar as 2 errados e criar 1 do combo
DELETE FROM contas_pagar 
WHERE venda_id = 'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4'
  AND categoria = 'comissao';

INSERT INTO contas_pagar (
  descricao, valor, status, fornecedor, categoria, venda_id,
  data_vencimento, created_at
) VALUES (
  'Comissão 40% - Combo Corte e Barba', 40.00, 'pendente',
  'Carlos Firme', 'comissao',
  'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4',
  '2026-04-25', '2026-04-25 15:38:49+00'
);

-- 3) BARBER_COMMISSIONS: deletar as 2 erradas e criar 1 do combo
DELETE FROM barber_commissions WHERE venda_id = 'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4';

INSERT INTO barber_commissions (
  barber_id, barber_name, valor, amount, tipo, status,
  venda_id, appointment_id, commission_rate, created_at
) VALUES (
  'd99d42ba-4987-45f5-a817-2cecbccadad9', 'Carlos Firme',
  40.00, 40.00, 'servico', 'pending',
  'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4',
  '8c7f38c6-ef8a-4b71-8aee-8514d9486391',
  40.00, '2026-04-25 15:38:49+00'
);

-- 4) FINANCIAL_RECORDS: deletar todos os 4 e recriar com 1 receita + 1 comissão
DELETE FROM financial_records WHERE reference_id = 'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4';

INSERT INTO financial_records (
  transaction_type, amount, status, description, category, subcategory,
  reference_id, reference_type, barber_id, barber_name, service_name,
  payment_method, transaction_date, payment_date, created_at
) VALUES
  ('revenue', 100.00, 'completed', 'Serviço: Combo Corte e Barba',
   'servico', 'servico_combo',
   'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4', 'venda',
   'd99d42ba-4987-45f5-a817-2cecbccadad9', 'Carlos Firme',
   'Combo Corte e Barba', 'CREDITO',
   '2026-04-25', '2026-04-25', '2026-04-25 15:38:48+00'),
  ('commission', 40.00, 'pending', 'Comissão 40% - Combo Corte e Barba',
   'comissao', 'servico_comissao',
   'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4', 'venda',
   'd99d42ba-4987-45f5-a817-2cecbccadad9', 'Carlos Firme',
   NULL, 'CREDITO',
   '2026-04-25', NULL, '2026-04-25 15:38:49+00');

-- 5) VENDAS_ITENS: ajusta preços unitários para refletir o combo (R$ 50 cada)
--    para que a soma dos itens bata com o valor_total da venda (R$ 100)
UPDATE vendas_itens
SET preco_unitario = 50.00, subtotal = 50.00
WHERE venda_id = 'bc4c5df3-1db5-49c3-a2c9-8aaad07346a4';