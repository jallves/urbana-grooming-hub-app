-- Ajuste manual de estoque: Refrigerante vendido hoje (venda 0bf2309f) não teve baixa de estoque
-- pelo bug do totem-checkout que não decrementava produtos extras vendidos junto com serviços
UPDATE painel_produtos
SET estoque = GREATEST(0, estoque - 1), updated_at = NOW()
WHERE id = '217dc53c-8f26-4359-bc2b-20d73b0a03e8';