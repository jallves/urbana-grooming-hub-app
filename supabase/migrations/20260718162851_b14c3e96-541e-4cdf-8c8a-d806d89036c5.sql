
-- Corrige duplicação do agendamento Fernando 17/07/2026 (venda 4a03c40d)
-- Estado atual: 1x Corte + 2x Barba (triplicado). Correto: 1x Corte + 1x Barba.

-- 1) vendas_itens: reduz Barba de 2 para 1
UPDATE vendas_itens
SET quantidade = 1, subtotal = 55.00
WHERE id = '41423e69-7c27-4e99-a753-edb823efc70d';

-- 2) vendas: total 165 -> 110
UPDATE vendas SET valor_total = 110.00 WHERE id = '4a03c40d-16e5-4c85-8973-82da8029d836';

-- 3) financial_records: remove 1 receita Barba duplicada e 1 comissão Barba duplicada
DELETE FROM financial_records
WHERE id IN (
  '00000000-0000-0000-0000-000000000000' -- placeholder, será substituído abaixo
);

DELETE FROM financial_records
WHERE reference_id = '4a03c40d-16e5-4c85-8973-82da8029d836'
  AND transaction_type = 'revenue'
  AND description = 'Serviço: Barba'
  AND created_at = (
    SELECT MAX(created_at) FROM financial_records
    WHERE reference_id = '4a03c40d-16e5-4c85-8973-82da8029d836'
      AND transaction_type = 'revenue' AND description = 'Serviço: Barba'
  );

DELETE FROM financial_records
WHERE reference_id = '4a03c40d-16e5-4c85-8973-82da8029d836'
  AND transaction_type = 'commission'
  AND description = 'Comissão 50% - Barba'
  AND created_at = (
    SELECT MAX(created_at) FROM financial_records
    WHERE reference_id = '4a03c40d-16e5-4c85-8973-82da8029d836'
      AND transaction_type = 'commission' AND description = 'Comissão 50% - Barba'
  );

-- 4) contas_receber: remove 1 Barba duplicada
DELETE FROM contas_receber WHERE id = 'ab1b29f6-b238-4170-8449-038b52d4f833';

-- 5) contas_pagar: remove 1 comissão Barba duplicada (a mais recente)
DELETE FROM contas_pagar
WHERE venda_id = '4a03c40d-16e5-4c85-8973-82da8029d836'
  AND categoria = 'comissao'
  AND descricao = 'Comissão 50% - Barba'
  AND created_at = (
    SELECT MAX(created_at) FROM contas_pagar
    WHERE venda_id = '4a03c40d-16e5-4c85-8973-82da8029d836'
      AND categoria = 'comissao' AND descricao = 'Comissão 50% - Barba'
  );

-- 6) barber_commissions: remove 1 comissão Barba duplicada
DELETE FROM barber_commissions WHERE id = 'd7c1f780-e620-4c70-b951-6772323ee8ca';
