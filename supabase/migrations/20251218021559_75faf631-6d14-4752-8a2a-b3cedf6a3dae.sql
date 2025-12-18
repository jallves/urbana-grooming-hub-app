-- Atualizar display_order dos serviços visíveis na home com valores sequenciais
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY nome) - 1 as new_order
  FROM painel_servicos
  WHERE show_on_home = true AND is_active = true
)
UPDATE painel_servicos
SET display_order = numbered.new_order, updated_at = now()
FROM numbered
WHERE painel_servicos.id = numbered.id;