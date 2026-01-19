-- Atualizar todos os produtos ativos para ter 10% de comissão
UPDATE painel_produtos 
SET 
  commission_percentage = 10,
  commission_value = ROUND(preco * 0.10, 2),
  updated_at = now()
WHERE ativo = true;

-- Verificar a atualização (comentário informativo)
-- Após esta migração, todos os produtos terão:
-- - commission_percentage = 10 (10%)
-- - commission_value = preço * 10% (valor em R$)