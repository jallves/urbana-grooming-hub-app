
-- CORREÇÃO 1: Remover duplicatas em barber_commissions do último checkout
DELETE FROM barber_commissions
WHERE id NOT IN (
  SELECT (array_agg(id ORDER BY created_at))[1]
  FROM barber_commissions
  WHERE appointment_id = 'c06c0e3d-c368-4c2c-8f3a-52c686818796'
  GROUP BY appointment_id, amount
)
AND appointment_id = 'c06c0e3d-c368-4c2c-8f3a-52c686818796';

-- CORREÇÃO 2: Adicionar comissão do serviço extra que está faltando em barber_commissions
INSERT INTO barber_commissions (
  barber_id,
  appointment_id,
  amount,
  commission_rate,
  status,
  appointment_source,
  commission_type,
  item_name
)
SELECT 
  '253dfbdb-0977-422f-9b33-b67a482513d3',
  'c06c0e3d-c368-4c2c-8f3a-52c686818796',
  40.00,
  40,
  'pending',
  'totem_appointment',
  'service',
  'Alisamento EUA'
WHERE NOT EXISTS (
  SELECT 1 FROM barber_commissions 
  WHERE appointment_id = 'c06c0e3d-c368-4c2c-8f3a-52c686818796'
  AND amount = 40.00
  AND item_name = 'Alisamento EUA'
);

-- CORREÇÃO 3: Atualizar comissão de produto para ter item_name
UPDATE barber_commissions 
SET 
  item_name = 'Pomada Modeladora Premium',
  commission_type = 'product'
WHERE appointment_id = 'c06c0e3d-c368-4c2c-8f3a-52c686818796'
AND amount = 9;

-- CORREÇÃO 4: Atualizar comissão de serviço principal para ter item_name
UPDATE barber_commissions 
SET 
  item_name = 'Barba + Sobrancelha',
  commission_type = 'service'
WHERE appointment_id = 'c06c0e3d-c368-4c2c-8f3a-52c686818796'
AND amount = 28
AND item_name IS NULL;
