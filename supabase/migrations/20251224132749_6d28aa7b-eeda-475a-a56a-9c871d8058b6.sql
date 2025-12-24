-- A tabela vendas precisa de políticas para anon para que as subqueries funcionem
-- O Totem precisa ler/atualizar vendas ABERTAS durante o checkout

DROP POLICY IF EXISTS "Totem can select vendas" ON public.vendas;
DROP POLICY IF EXISTS "Totem can update vendas" ON public.vendas;
DROP POLICY IF EXISTS "Totem can insert vendas" ON public.vendas;

-- Permitir leitura de vendas abertas pelo Totem
CREATE POLICY "Totem can select vendas" 
ON public.vendas 
FOR SELECT 
TO anon, authenticated
USING (status = 'ABERTA');

-- Permitir atualização de vendas abertas (para atualizar totais)
CREATE POLICY "Totem can update vendas" 
ON public.vendas 
FOR UPDATE 
TO anon, authenticated
USING (status = 'ABERTA')
WITH CHECK (status IN ('ABERTA', 'PAGA', 'CANCELADA'));

-- Permitir inserção de novas vendas pelo Totem
CREATE POLICY "Totem can insert vendas" 
ON public.vendas 
FOR INSERT 
TO anon, authenticated
WITH CHECK (status = 'ABERTA');