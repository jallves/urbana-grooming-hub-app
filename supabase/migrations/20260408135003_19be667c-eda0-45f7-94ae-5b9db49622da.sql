
-- Inserir gorjeta de R$45 para Carlos Firme em contas_pagar
INSERT INTO contas_pagar (descricao, valor, fornecedor, categoria, data_vencimento, status, forma_pagamento, observacoes)
VALUES (
  'Gorjeta - Carlos Firme',
  45.00,
  'Carlos Firme',
  'comissao',
  CURRENT_DATE,
  'pendente',
  'dinheiro',
  'Gorjeta registrada manualmente via ERP'
);

-- Inserir comissão de gorjeta em barber_commissions para aparecer no painel do barbeiro
INSERT INTO barber_commissions (barber_id, barber_name, valor, amount, tipo, status, commission_rate, appointment_source)
VALUES (
  'd99d42ba-4987-45f5-a817-2cecbccadad9',
  'Carlos Firme',
  45.00,
  45.00,
  'gorjeta',
  'pendente',
  100,
  'admin_manual'
);

-- Inserir registro financeiro para rastreabilidade no ERP
INSERT INTO financial_records (transaction_type, category, description, amount, barber_id, barber_name, status, payment_method, notes)
VALUES (
  'commission',
  'gorjeta',
  'Gorjeta - Carlos Firme',
  45.00,
  'd99d42ba-4987-45f5-a817-2cecbccadad9',
  'Carlos Firme',
  'pending',
  'dinheiro',
  'Gorjeta registrada manualmente via ERP'
);
