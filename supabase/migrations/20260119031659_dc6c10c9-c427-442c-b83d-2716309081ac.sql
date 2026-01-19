-- Adicionar campos de comissão na tabela painel_produtos
ALTER TABLE public.painel_produtos 
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN public.painel_produtos.commission_percentage IS 'Percentual de comissão do barbeiro sobre o produto (0-100)';
COMMENT ON COLUMN public.painel_produtos.commission_value IS 'Valor fixo de comissão do barbeiro por unidade vendida';