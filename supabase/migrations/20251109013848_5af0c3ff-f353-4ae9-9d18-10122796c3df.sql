-- Ajustar políticas RLS para totem_product_sales
-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Sistema pode criar vendas" ON totem_product_sales;
DROP POLICY IF EXISTS "Sistema pode atualizar vendas" ON totem_product_sales;

-- Criar políticas que permitem operações públicas para o totem
CREATE POLICY "Totem público pode criar vendas"
ON totem_product_sales
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Totem público pode atualizar vendas"
ON totem_product_sales
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Ajustar políticas RLS para totem_product_sale_items
DROP POLICY IF EXISTS "Sistema pode criar itens" ON totem_product_sale_items;

CREATE POLICY "Totem público pode criar itens"
ON totem_product_sale_items
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Totem público pode atualizar itens"
ON totem_product_sale_items
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);