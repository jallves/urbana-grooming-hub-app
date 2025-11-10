
-- ============================================================================
-- MIGRATION 1: Adicionar rastreamento de origem em transaction_items
-- ============================================================================
-- Permite identificar se item_id vem de painel_servicos, painel_produtos, services, etc.

-- Adicionar coluna source_table
ALTER TABLE transaction_items 
ADD COLUMN IF NOT EXISTS source_table TEXT;

-- Comentário explicativo
COMMENT ON COLUMN transaction_items.source_table IS 
'Tabela de origem do item: painel_servicos, painel_produtos, services, produtos';

-- Índice para melhorar performance em queries
CREATE INDEX IF NOT EXISTS idx_transaction_items_source_table 
ON transaction_items(source_table);

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Coluna source_table adicionada em transaction_items';
END $$;
