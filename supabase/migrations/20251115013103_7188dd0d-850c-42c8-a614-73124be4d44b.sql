-- Add commission fields to painel_produtos table
ALTER TABLE public.painel_produtos
ADD COLUMN IF NOT EXISTS commission_value NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5, 2) DEFAULT 0;

COMMENT ON COLUMN public.painel_produtos.commission_value IS 'Valor da comissão em reais';
COMMENT ON COLUMN public.painel_produtos.commission_percentage IS 'Percentual da comissão sobre o preço de venda';