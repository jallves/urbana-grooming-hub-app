
-- ========================================
-- CORREÇÃO DOS DADOS DO ÚLTIMO CHECKOUT
-- Venda: aa0c253e-9598-419b-b069-e5290f043f6c
-- Agendamento: 7e364e83-06bf-4c08-9d71-ad7c243f0b20
-- Serviço extra faltante: Alisamento EUA (R$ 100,00)
-- ========================================

-- 1. Inserir o serviço extra que falta em vendas_itens
INSERT INTO vendas_itens (venda_id, tipo, ref_id, nome, quantidade, preco_unit, total)
VALUES (
  'aa0c253e-9598-419b-b069-e5290f043f6c',
  'SERVICO_EXTRA',
  '3a91ae49-3a64-4381-9bfb-b56344e907c1',
  'Alisamento EUA',
  1,
  100.00,
  100.00
);

-- 2. Atualizar total da venda (288 + 100 = 388)
UPDATE vendas 
SET subtotal = 388.00, total = 388.00
WHERE id = 'aa0c253e-9598-419b-b069-e5290f043f6c';

-- 3. Criar receita do serviço extra no ERP (financial_records)
INSERT INTO financial_records (
  transaction_number,
  transaction_type,
  category,
  subcategory,
  gross_amount,
  discount_amount,
  tax_amount,
  net_amount,
  status,
  description,
  notes,
  transaction_date,
  completed_at,
  appointment_id,
  client_id,
  barber_id,
  metadata
) VALUES (
  'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  'revenue',
  'services',
  'service',
  100.00,
  0,
  0,
  100.00,
  'completed',
  'Serviço Extra: Alisamento EUA',
  'Checkout Totem - Correção manual',
  '2025-12-24',
  '2025-12-24T15:33:20',
  '7e364e83-06bf-4c08-9d71-ad7c243f0b20',
  '53948cb8-4bf7-4c29-80ad-7411dc93c082',
  '253dfbdb-0977-422f-9b33-b67a482513d3',
  '{"source": "appointment", "service_id": "3a91ae49-3a64-4381-9bfb-b56344e907c1", "service_name": "Alisamento EUA", "payment_method": "credit_card", "is_extra": true}'::jsonb
);

-- 4. Criar comissão do serviço extra no ERP (financial_records) - 40%
INSERT INTO financial_records (
  transaction_number,
  transaction_type,
  category,
  subcategory,
  gross_amount,
  discount_amount,
  tax_amount,
  net_amount,
  status,
  description,
  notes,
  transaction_date,
  appointment_id,
  client_id,
  barber_id,
  metadata
) VALUES (
  'COM-TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  'commission',
  'staff_payments',
  'commission',
  40.00,
  0,
  0,
  40.00,
  'pending',
  'Comissão 40% - Serviço Extra: Alisamento EUA',
  'Comissão sobre serviço extra realizado',
  '2025-12-24',
  '7e364e83-06bf-4c08-9d71-ad7c243f0b20',
  '53948cb8-4bf7-4c29-80ad-7411dc93c082',
  '253dfbdb-0977-422f-9b33-b67a482513d3',
  '{"commission_rate": 40, "service_id": "3a91ae49-3a64-4381-9bfb-b56344e907c1", "service_name": "Alisamento EUA", "service_amount": 100, "is_extra": true}'::jsonb
);

-- 5. Criar comissão do serviço extra em barber_commissions
INSERT INTO barber_commissions (
  barber_id,
  appointment_id,
  amount,
  commission_rate,
  status,
  appointment_source,
  commission_type,
  item_name
) VALUES (
  '253dfbdb-0977-422f-9b33-b67a482513d3',
  '7e364e83-06bf-4c08-9d71-ad7c243f0b20',
  40.00,
  40,
  'pending',
  'totem_appointment',
  'service',
  'Alisamento EUA (Extra)'
);

-- 6. Atualizar comissão legacy em comissoes para incluir serviço extra
UPDATE comissoes 
SET valor = 96.00  -- R$ 56 (principal) + R$ 40 (extra)
WHERE agendamento_id = '7e364e83-06bf-4c08-9d71-ad7c243f0b20';
