
-- CORREÇÃO 4: Remover financial_records duplicados

-- Remover receita duplicada da Cera Capilar Matte
DELETE FROM payment_records WHERE financial_record_id = '8fd7a20b-ce1b-4e0e-9114-77ebe66f9463';
DELETE FROM financial_records WHERE id = '8fd7a20b-ce1b-4e0e-9114-77ebe66f9463';

-- Remover comissão duplicada da Cera Capilar Matte
DELETE FROM payment_records WHERE financial_record_id = 'a96058b6-a56e-405f-974b-9cd5a6ab4384';
DELETE FROM financial_records WHERE id = 'a96058b6-a56e-405f-974b-9cd5a6ab4384';

-- CORREÇÃO 5: Inserir receita do serviço extra (Barba + Sobrancelha)
INSERT INTO financial_records (
  transaction_number,
  transaction_type,
  category,
  subcategory,
  description,
  gross_amount,
  net_amount,
  discount_amount,
  tax_amount,
  status,
  transaction_date,
  appointment_id,
  barber_id,
  client_id,
  notes,
  metadata
)
VALUES (
  'TRX-20251224-' || FLOOR(RANDOM() * 1000000)::TEXT,
  'revenue'::transaction_type,
  'services',
  'extra_service',
  'Serviço Extra: Barba + Sobrancelha',
  70.00,
  70.00,
  0.00,
  0.00,
  'completed'::transaction_status,
  '2025-12-24',
  '61a09769-ccc7-43de-b1a8-83af5b5e3771',
  'c1da3ca2-225b-48a3-9e08-66ae6003a17a',
  '53948cb8-4bf7-4c29-80ad-7411dc93c082',
  'Serviço extra adicionado no checkout',
  jsonb_build_object(
    'service_id', '21c08e34-cfe5-443f-8651-b2699046e166',
    'service_name', 'Barba + Sobrancelha',
    'source', 'appointment',
    'payment_method', 'credit_card'
  )
);

-- CORREÇÃO 6: Inserir comissão do serviço extra (40% de R$70 = R$28)
INSERT INTO financial_records (
  transaction_number,
  transaction_type,
  category,
  subcategory,
  description,
  gross_amount,
  net_amount,
  discount_amount,
  tax_amount,
  status,
  transaction_date,
  appointment_id,
  barber_id,
  client_id,
  notes,
  metadata
)
VALUES (
  'COM-TRX-20251224-' || FLOOR(RANDOM() * 1000000)::TEXT,
  'commission'::transaction_type,
  'staff_payments',
  'commission',
  'Comissão 40% - Serviço Extra: Barba + Sobrancelha',
  28.00,
  28.00,
  0.00,
  0.00,
  'pending'::transaction_status,
  '2025-12-24',
  '61a09769-ccc7-43de-b1a8-83af5b5e3771',
  'c1da3ca2-225b-48a3-9e08-66ae6003a17a',
  '53948cb8-4bf7-4c29-80ad-7411dc93c082',
  'Comissão sobre serviço extra realizado',
  jsonb_build_object(
    'service_id', '21c08e34-cfe5-443f-8651-b2699046e166',
    'service_name', 'Barba + Sobrancelha',
    'service_amount', 70,
    'commission_rate', 40
  )
);

-- CORREÇÃO 7: Atualizar comissão na tabela comissoes (somar o serviço extra)
-- Valor atual: R$56 | Valor correto: R$56 + R$28 = R$84 (só serviços)
UPDATE comissoes 
SET valor = 84.00
WHERE id = '43c0d8d4-e5c9-4314-9474-89a30115111b';
