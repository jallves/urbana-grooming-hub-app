-- Políticas RLS para totem_product_sales e totem_product_sale_items
-- Permitir que o totem crie e atualize vendas de produtos

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow public access to product sales" ON totem_product_sales;
DROP POLICY IF EXISTS "Allow public access to product sale items" ON totem_product_sale_items;
DROP POLICY IF EXISTS "Allow insert for product sales" ON totem_product_sales;
DROP POLICY IF EXISTS "Allow update for product sales" ON totem_product_sales;
DROP POLICY IF EXISTS "Allow insert for product sale items" ON totem_product_sale_items;

-- Políticas para totem_product_sales
CREATE POLICY "Allow public insert for product sales"
ON totem_product_sales
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update for product sales"
ON totem_product_sales
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public select for product sales"
ON totem_product_sales
FOR SELECT
TO public
USING (true);

-- Políticas para totem_product_sale_items
CREATE POLICY "Allow public insert for product sale items"
ON totem_product_sale_items
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public select for product sale items"
ON totem_product_sale_items
FOR SELECT
TO public
USING (true);