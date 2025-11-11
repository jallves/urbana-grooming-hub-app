
-- ============================================
-- CORREÇÃO: Reprocessar agendamento e421f76e-78e5-43c7-88d6-369282efd88d
-- Criar registros financeiros que falharam devido ao bug de timestamp
-- ============================================

-- 1. RECEITA: Serviço 'Barba Terapêutica' (R$ 100)
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
  transaction_date,
  completed_at,
  appointment_id,
  client_id,
  barber_id,
  metadata,
  created_at,
  updated_at
) VALUES (
  'TRX-20251111-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  'revenue',
  'services',
  'service',
  100.00,
  0,
  0,
  100.00,
  'completed',
  'Serviço: ''Barba Terapêutica''',
  '2025-11-11',
  '2025-11-11 11:30:00',
  'e421f76e-78e5-43c7-88d6-369282efd88d',
  '23cce7d7-197d-4fe0-a821-c9f49a799545',
  'e396adc9-c83f-432d-a5ba-f8202dd054a7',
  jsonb_build_object(
    'source', 'appointment',
    'service_id', '355e3290-f169-41e4-b0bb-db519a46dc8f',
    'service_name', '''Barba Terapêutica''',
    'payment_method', 'credit_card',
    'payment_time', '2025-11-11T11:30:00',
    'status_totem', 'FINALIZADO',
    'reprocessed', true,
    'original_failure', 'timestamp format error'
  ),
  NOW(),
  NOW()
);

-- 2. COMISSÃO: Serviço 'Barba Terapêutica' (40% de R$ 100 = R$ 40)
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
  transaction_date,
  appointment_id,
  barber_id,
  metadata,
  created_at,
  updated_at
) VALUES (
  'COM-20251111-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  'commission',
  'staff_payments',
  'commission',
  40.00,
  0,
  0,
  40.00,
  'pending',
  'Comissão 40% - Serviço: ''Barba Terapêutica''',
  '2025-11-11',
  'e421f76e-78e5-43c7-88d6-369282efd88d',
  'e396adc9-c83f-432d-a5ba-f8202dd054a7',
  jsonb_build_object(
    'commission_rate', 40,
    'service_id', '355e3290-f169-41e4-b0bb-db519a46dc8f',
    'service_name', '''Barba Terapêutica''',
    'service_amount', 100.00,
    'reprocessed', true
  ),
  NOW(),
  NOW()
);

-- 3. RECEITA: Serviço 'Corte Premium' (R$ 50)
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
  transaction_date,
  completed_at,
  appointment_id,
  client_id,
  barber_id,
  metadata,
  created_at,
  updated_at
) VALUES (
  'TRX-20251111-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  'revenue',
  'services',
  'service',
  50.00,
  0,
  0,
  50.00,
  'completed',
  'Serviço: Corte Premium',
  '2025-11-11',
  '2025-11-11 11:30:00',
  'e421f76e-78e5-43c7-88d6-369282efd88d',
  '23cce7d7-197d-4fe0-a821-c9f49a799545',
  'e396adc9-c83f-432d-a5ba-f8202dd054a7',
  jsonb_build_object(
    'source', 'appointment',
    'service_id', '88cdcfc5-c91b-4112-9663-5fa5db2887c8',
    'service_name', 'Corte Premium',
    'payment_method', 'credit_card',
    'payment_time', '2025-11-11T11:30:00',
    'status_totem', 'FINALIZADO',
    'extra_service', true,
    'reprocessed', true
  ),
  NOW(),
  NOW()
);

-- 4. COMISSÃO: Serviço 'Corte Premium' (40% de R$ 50 = R$ 20)
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
  transaction_date,
  appointment_id,
  barber_id,
  metadata,
  created_at,
  updated_at
) VALUES (
  'COM-20251111-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  'commission',
  'staff_payments',
  'commission',
  20.00,
  0,
  0,
  20.00,
  'pending',
  'Comissão 40% - Serviço: Corte Premium',
  '2025-11-11',
  'e421f76e-78e5-43c7-88d6-369282efd88d',
  'e396adc9-c83f-432d-a5ba-f8202dd054a7',
  jsonb_build_object(
    'commission_rate', 40,
    'service_id', '88cdcfc5-c91b-4112-9663-5fa5db2887c8',
    'service_name', 'Corte Premium',
    'service_amount', 50.00,
    'extra_service', true,
    'reprocessed', true
  ),
  NOW(),
  NOW()
);

-- 5. RECEITA: Produto 'Pomada Modeladora' (R$ 35) - SEM COMISSÃO
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
  transaction_date,
  completed_at,
  appointment_id,
  client_id,
  barber_id,
  metadata,
  created_at,
  updated_at
) VALUES (
  'TRX-20251111-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
  'revenue',
  'products',
  'product',
  35.00,
  0,
  0,
  35.00,
  'completed',
  'Produto: Pomada Modeladora',
  '2025-11-11',
  '2025-11-11 11:30:00',
  'e421f76e-78e5-43c7-88d6-369282efd88d',
  '23cce7d7-197d-4fe0-a821-c9f49a799545',
  NULL,
  jsonb_build_object(
    'source', 'appointment',
    'product_id', '2764b9a8-319f-4a29-8ab5-dea82d5480bc',
    'product_name', 'Pomada Modeladora',
    'payment_method', 'credit_card',
    'payment_time', '2025-11-11T11:30:00',
    'status_totem', 'FINALIZADO',
    'reprocessed', true
  ),
  NOW(),
  NOW()
);

-- 6. Criar registros em barber_commissions (para rastreamento de comissões)
INSERT INTO barber_commissions (
  barber_id,
  appointment_id,
  amount,
  commission_rate,
  status,
  appointment_source,
  created_at,
  updated_at
) VALUES 
  (
    'e396adc9-c83f-432d-a5ba-f8202dd054a7',
    'e421f76e-78e5-43c7-88d6-369282efd88d',
    40.00,
    40,
    'pending',
    'totem',
    NOW(),
    NOW()
  ),
  (
    'e396adc9-c83f-432d-a5ba-f8202dd054a7',
    'e421f76e-78e5-43c7-88d6-369282efd88d',
    20.00,
    40,
    'pending',
    'totem',
    NOW(),
    NOW()
  );

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Registros financeiros reprocessados com sucesso para agendamento e421f76e-78e5-43c7-88d6-369282efd88d';
  RAISE NOTICE '   - 3 receitas criadas (2 serviços + 1 produto): R$ 185,00';
  RAISE NOTICE '   - 2 comissões criadas (40%%): R$ 60,00';
  RAISE NOTICE '   - Forma de pagamento: credit_card';
  RAISE NOTICE '   - Data: 2025-11-11 11:30:00';
END $$;
