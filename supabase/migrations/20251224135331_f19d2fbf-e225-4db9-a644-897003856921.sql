
-- Inserir financial_records faltantes para o serviço extra Alisamento EUA

-- 1. Receita do serviço extra
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
SELECT 
  'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || FLOOR(RANDOM() * 1000000)::TEXT,
  'revenue'::transaction_type,
  'services',
  'extra_service',
  'Serviço Extra: Alisamento EUA',
  100.00,
  100.00,
  0.00,
  0.00,
  'completed'::transaction_status,
  '2025-12-24',
  'cffaac8a-8e00-4424-aaab-4d51aa8a4370',
  '253dfbdb-0977-422f-9b33-b67a482513d3',
  '53948cb8-4bf7-4c29-80ad-7411dc93c082',
  'Serviço extra adicionado no checkout',
  jsonb_build_object(
    'service_id', '3a91ae49-3a64-4381-9bfb-b56344e907c1',
    'service_name', 'Alisamento EUA',
    'source', 'appointment',
    'payment_method', 'credit_card'
  );

-- 2. Comissão sobre serviço extra (40%)
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
SELECT 
  'COM-TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || FLOOR(RANDOM() * 1000000)::TEXT,
  'commission'::transaction_type,
  'staff_payments',
  'commission',
  'Comissão 40% - Serviço Extra: Alisamento EUA',
  40.00,
  40.00,
  0.00,
  0.00,
  'pending'::transaction_status,
  '2025-12-24',
  'cffaac8a-8e00-4424-aaab-4d51aa8a4370',
  '253dfbdb-0977-422f-9b33-b67a482513d3',
  '53948cb8-4bf7-4c29-80ad-7411dc93c082',
  'Comissão sobre serviço extra realizado',
  jsonb_build_object(
    'service_id', '3a91ae49-3a64-4381-9bfb-b56344e907c1',
    'service_name', 'Alisamento EUA',
    'service_amount', 100,
    'commission_rate', 40
  );
