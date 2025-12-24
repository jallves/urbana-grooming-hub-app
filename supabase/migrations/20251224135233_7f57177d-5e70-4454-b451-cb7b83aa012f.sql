
-- 1. Inserir o serviço extra que está faltando em vendas_itens
INSERT INTO vendas_itens (venda_id, tipo, ref_id, nome, quantidade, preco_unit, total)
VALUES (
  'b6021c7a-24f4-4c63-9e0f-3326b07d938c',
  'SERVICO_EXTRA',
  '3a91ae49-3a64-4381-9bfb-b56344e907c1',
  'Alisamento EUA',
  1,
  100.00,
  100.00
);

-- 2. Recalcular o subtotal/total da venda para garantir consistência
UPDATE vendas 
SET subtotal = (
  SELECT COALESCE(SUM(total), 0) FROM vendas_itens WHERE venda_id = 'b6021c7a-24f4-4c63-9e0f-3326b07d938c'
),
total = (
  SELECT COALESCE(SUM(total), 0) FROM vendas_itens WHERE venda_id = 'b6021c7a-24f4-4c63-9e0f-3326b07d938c'
) - COALESCE(desconto, 0)
WHERE id = 'b6021c7a-24f4-4c63-9e0f-3326b07d938c';
