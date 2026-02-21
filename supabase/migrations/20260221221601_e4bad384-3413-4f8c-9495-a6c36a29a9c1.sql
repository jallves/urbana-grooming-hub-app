
-- Adicionar coluna estoque_minimo aos produtos (padrão: 10)
ALTER TABLE public.painel_produtos 
ADD COLUMN IF NOT EXISTS estoque_minimo integer NOT NULL DEFAULT 10;

-- Recriar função de decremento de estoque (corrige erro PGRST202)
CREATE OR REPLACE FUNCTION public.decrease_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE painel_produtos
  SET 
    estoque = GREATEST(0, estoque - p_quantity),
    updated_at = NOW()
  WHERE id = p_product_id
    AND estoque >= p_quantity;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado ou estoque insuficiente';
  END IF;
END;
$$;
