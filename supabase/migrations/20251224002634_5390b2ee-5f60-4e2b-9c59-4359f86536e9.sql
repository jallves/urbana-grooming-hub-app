
-- ============================================
-- Criar políticas RLS para as 4 tabelas restantes
-- ============================================

-- 1. financial_transactions - Dados financeiros sensíveis
CREATE POLICY "Admin roles can manage financial_transactions"
ON public.financial_transactions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- 2. product_categories - Categorias de produtos
CREATE POLICY "Authenticated can view product_categories"
ON public.product_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin roles can manage product_categories"
ON public.product_categories
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 3. product_category_relations - Relações produto-categoria
CREATE POLICY "Authenticated can view product_category_relations"
ON public.product_category_relations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin roles can manage product_category_relations"
ON public.product_category_relations
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 4. recipes - Receitas internas
CREATE POLICY "Admin roles can manage recipes"
ON public.recipes
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);
