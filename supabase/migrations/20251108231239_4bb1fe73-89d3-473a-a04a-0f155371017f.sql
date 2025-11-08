
-- Adicionar política temporária para permitir migração de produtos
CREATE POLICY "Allow authenticated insert for products migration"
ON painel_produtos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Migrar produtos ativos de products para painel_produtos
INSERT INTO painel_produtos (
  nome, 
  descricao, 
  preco, 
  estoque, 
  estoque_minimo, 
  categoria, 
  imagens, 
  is_active, 
  destaque
)
SELECT 
  name,
  COALESCE(description, ''),
  price,
  COALESCE(stock_quantity, 0),
  5,
  'Produtos',
  '[]'::jsonb,
  is_active,
  false
FROM products
WHERE is_active = true
ON CONFLICT DO NOTHING;
