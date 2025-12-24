-- Política para permitir que o Totem (anon) insira itens de venda
-- O Totem precisa adicionar produtos durante o checkout

-- Primeiro, verificar se já existe a policy e remover
DROP POLICY IF EXISTS "Totem can insert vendas_itens" ON public.vendas_itens;
DROP POLICY IF EXISTS "Totem can select vendas_itens" ON public.vendas_itens;
DROP POLICY IF EXISTS "Totem can update vendas_itens" ON public.vendas_itens;

-- Criar política para permitir que qualquer um insira itens em vendas ABERTAS
-- Isso é seguro porque o Totem só opera com vendas em status ABERTA
CREATE POLICY "Totem can insert vendas_itens" 
ON public.vendas_itens 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendas 
    WHERE vendas.id = vendas_itens.venda_id 
    AND vendas.status = 'ABERTA'
  )
);

-- Permitir leitura de itens de vendas abertas
CREATE POLICY "Totem can select vendas_itens" 
ON public.vendas_itens 
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendas 
    WHERE vendas.id = vendas_itens.venda_id 
    AND vendas.status = 'ABERTA'
  )
);

-- Permitir update de itens em vendas abertas (para atualizar quantidades)
CREATE POLICY "Totem can update vendas_itens" 
ON public.vendas_itens 
FOR UPDATE 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendas 
    WHERE vendas.id = vendas_itens.venda_id 
    AND vendas.status = 'ABERTA'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendas 
    WHERE vendas.id = vendas_itens.venda_id 
    AND vendas.status = 'ABERTA'
  )
);