
-- 1. Adicionar serviço extra faltando na venda
INSERT INTO vendas_itens (venda_id, tipo, ref_id, nome, quantidade, preco_unit, total)
VALUES (
  '31358e0a-28a7-4813-9ed6-73a99be63dd5',
  'SERVICO_EXTRA',
  '3a91ae49-3a64-4381-9bfb-b56344e907c1',
  'Alisamento EUA',
  1,
  100.00,
  100.00
);

-- 2. Corrigir total da venda
UPDATE vendas 
SET subtotal = 260.00, total = 260.00 
WHERE id = '31358e0a-28a7-4813-9ed6-73a99be63dd5';
