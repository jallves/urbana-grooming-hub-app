
-- 3. Deletar itens de venda duplicados
WITH ranked_items AS (
  SELECT 
    id,
    nome,
    ref_id,
    tipo,
    ROW_NUMBER() OVER (PARTITION BY venda_id, ref_id, tipo ORDER BY id ASC) as rn
  FROM vendas_itens 
  WHERE venda_id = '50f26d99-277d-459b-b6cd-51c11fa81a21'
)
DELETE FROM vendas_itens 
WHERE id IN (
  SELECT id FROM ranked_items WHERE rn > 1
);
