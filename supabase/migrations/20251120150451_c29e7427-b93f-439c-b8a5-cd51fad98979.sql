
-- Adicionar campo para diferenciar tipo de comissão (serviço ou produto)
ALTER TABLE barber_commissions 
ADD COLUMN IF NOT EXISTS commission_type text DEFAULT 'service' CHECK (commission_type IN ('service', 'product'));

-- Adicionar campo para referência de produto
ALTER TABLE barber_commissions 
ADD COLUMN IF NOT EXISTS product_sale_id uuid REFERENCES totem_product_sales(id);

-- Adicionar campo para nome do item (serviço ou produto)
ALTER TABLE barber_commissions 
ADD COLUMN IF NOT EXISTS item_name text;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_barber_commissions_type ON barber_commissions(commission_type);
CREATE INDEX IF NOT EXISTS idx_barber_commissions_product_sale ON barber_commissions(product_sale_id);

COMMENT ON COLUMN barber_commissions.commission_type IS 'Tipo de comissão: service para serviços, product para produtos';
COMMENT ON COLUMN barber_commissions.product_sale_id IS 'Referência para venda de produto quando commission_type = product';
COMMENT ON COLUMN barber_commissions.item_name IS 'Nome do serviço ou produto que gerou a comissão';
