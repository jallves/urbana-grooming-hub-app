
-- ========================================
-- CORREÇÃO DOS DADOS DO ÚLTIMO CHECKOUT
-- Venda: d6414cbe-a673-4ab0-a1d5-e6b2ee0357cd
-- Agendamento: b9d7201d-10b3-4614-8b1d-9a192d2879d6
-- ========================================

-- 1. Inserir o serviço extra que falta em vendas_itens
INSERT INTO vendas_itens (venda_id, tipo, ref_id, nome, quantidade, preco_unit, total)
VALUES (
  'd6414cbe-a673-4ab0-a1d5-e6b2ee0357cd',
  'SERVICO_EXTRA',
  '3a91ae49-3a64-4381-9bfb-b56344e907c1',
  'Alisamento EUA',
  1,
  100.00,
  100.00
);

-- 2. Criar receita do serviço extra no ERP (financial_records)
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
  'Checkout Totem - Sessão d58ae52a-817e-4c16-9a73-a91cbf044ee7',
  '2025-12-24',
  '2025-12-24T12:30:00',
  'b9d7201d-10b3-4614-8b1d-9a192d2879d6',
  '53948cb8-4bf7-4c29-80ad-7411dc93c082',
  'c1da3ca2-225b-48a3-9e08-66ae6003a17a',
  '{"source": "appointment", "service_id": "3a91ae49-3a64-4381-9bfb-b56344e907c1", "service_name": "Alisamento EUA", "payment_method": "credit_card", "is_extra": true}'::jsonb
);

-- 3. Criar comissão do serviço extra no ERP (financial_records) - 40%
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
  'b9d7201d-10b3-4614-8b1d-9a192d2879d6',
  '53948cb8-4bf7-4c29-80ad-7411dc93c082',
  'c1da3ca2-225b-48a3-9e08-66ae6003a17a',
  '{"commission_rate": 40, "service_id": "3a91ae49-3a64-4381-9bfb-b56344e907c1", "service_name": "Alisamento EUA", "service_amount": 100, "is_extra": true}'::jsonb
);

-- 4. Criar comissão do serviço extra em barber_commissions
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
  'c1da3ca2-225b-48a3-9e08-66ae6003a17a',
  'b9d7201d-10b3-4614-8b1d-9a192d2879d6',
  40.00,
  40,
  'pending',
  'totem_appointment',
  'service',
  'Alisamento EUA (Extra)'
);

-- 5. Atualizar comissão legacy em comissoes para incluir serviço extra
UPDATE comissoes 
SET valor = 80.00  -- R$ 40 (principal) + R$ 40 (extra)
WHERE agendamento_id = 'b9d7201d-10b3-4614-8b1d-9a192d2879d6';
