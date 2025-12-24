
-- 3. Adicionar receita do serviço extra no ERP
INSERT INTO financial_records (
  transaction_number,
  transaction_type,
  category,
  subcategory,
  description,
  gross_amount,
  net_amount,
  status,
  transaction_date,
  appointment_id,
  barber_id,
  metadata
)
VALUES (
  'TRX-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6),
  'revenue',
  'services',
  'extra_service',
  'Serviço Extra: Alisamento EUA',
  100.00,
  100.00,
  'completed',
  CURRENT_DATE,
  'c06c0e3d-c368-4c2c-8f3a-52c686818796',
  '253dfbdb-0977-422f-9b33-b67a482513d3',
  '{"service_id": "3a91ae49-3a64-4381-9bfb-b56344e907c1", "service_name": "Alisamento EUA", "payment_method": "credit_card", "source": "appointment"}'::jsonb
);

-- 4. Adicionar comissão do serviço extra no ERP
INSERT INTO financial_records (
  transaction_number,
  transaction_type,
  category,
  subcategory,
  description,
  gross_amount,
  net_amount,
  status,
  transaction_date,
  appointment_id,
  barber_id,
  metadata
)
VALUES (
  'TRX-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6),
  'commission',
  'staff_payments',
  'commission',
  'Comissão 40% - Serviço Extra: Alisamento EUA',
  40.00,
  40.00,
  'pending',
  CURRENT_DATE,
  'c06c0e3d-c368-4c2c-8f3a-52c686818796',
  '253dfbdb-0977-422f-9b33-b67a482513d3',
  '{"commission_rate": 40, "service_amount": 100, "service_id": "3a91ae49-3a64-4381-9bfb-b56344e907c1", "service_name": "Alisamento EUA"}'::jsonb
);

-- 5. Atualizar comissão na tabela comissoes (somar R$40 do serviço extra)
UPDATE comissoes 
SET valor = 68.00
WHERE agendamento_id = 'c06c0e3d-c368-4c2c-8f3a-52c686818796';
