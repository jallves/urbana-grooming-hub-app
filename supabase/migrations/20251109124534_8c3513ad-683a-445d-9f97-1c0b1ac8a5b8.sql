-- Create function to decrease product stock
CREATE OR REPLACE FUNCTION decrease_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update stock
  UPDATE painel_produtos
  SET 
    estoque = estoque - p_quantity,
    updated_at = NOW()
  WHERE id = p_product_id
    AND estoque >= p_quantity;
    
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado ou estoque insuficiente';
  END IF;
END;
$$;