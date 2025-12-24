
-- 4. Recalcular totais da venda
UPDATE vendas 
SET 
  subtotal = (SELECT COALESCE(SUM(total), 0) FROM vendas_itens WHERE venda_id = '50f26d99-277d-459b-b6cd-51c11fa81a21'),
  total = (SELECT COALESCE(SUM(total), 0) FROM vendas_itens WHERE venda_id = '50f26d99-277d-459b-b6cd-51c11fa81a21'),
  updated_at = NOW()
WHERE id = '50f26d99-277d-459b-b6cd-51c11fa81a21';
