
-- ============================================================================
-- MIGRATION 6: Atualizar registros antigos do ERP com source_table
-- ============================================================================

-- Atualizar transaction_items com source_table baseado no item_id existente
DO $$
DECLARE
  v_updated_painel_servicos INTEGER := 0;
  v_updated_services INTEGER := 0;
  v_updated_painel_produtos INTEGER := 0;
  v_updated_produtos INTEGER := 0;
  v_orphans INTEGER := 0;
BEGIN
  -- 1. Marcar itens de painel_servicos
  UPDATE transaction_items ti
  SET source_table = 'painel_servicos'
  WHERE ti.item_type = 'service'
    AND ti.source_table IS NULL
    AND EXISTS (
      SELECT 1 FROM painel_servicos ps WHERE ps.id = ti.item_id
    );
  
  GET DIAGNOSTICS v_updated_painel_servicos = ROW_COUNT;
  
  -- 2. Marcar itens de services
  UPDATE transaction_items ti
  SET source_table = 'services'
  WHERE ti.item_type = 'service'
    AND ti.source_table IS NULL
    AND EXISTS (
      SELECT 1 FROM services s WHERE s.id = ti.item_id
    );
  
  GET DIAGNOSTICS v_updated_services = ROW_COUNT;
  
  -- 3. Marcar itens de painel_produtos
  UPDATE transaction_items ti
  SET source_table = 'painel_produtos'
  WHERE ti.item_type = 'product'
    AND ti.source_table IS NULL
    AND EXISTS (
      SELECT 1 FROM painel_produtos pp WHERE pp.id = ti.item_id
    );
  
  GET DIAGNOSTICS v_updated_painel_produtos = ROW_COUNT;
  
  -- 4. Marcar itens de produtos (se existir algum)
  UPDATE transaction_items ti
  SET source_table = 'produtos'
  WHERE ti.item_type = 'product'
    AND ti.source_table IS NULL
    AND EXISTS (
      SELECT 1 FROM produtos p WHERE p.id = ti.item_id
    );
  
  GET DIAGNOSTICS v_updated_produtos = ROW_COUNT;
  
  -- 5. Contar órfãos (IDs que não existem em nenhuma tabela)
  SELECT COUNT(*) INTO v_orphans
  FROM transaction_items
  WHERE source_table IS NULL;
  
  -- Log detalhado
  RAISE NOTICE '';
  RAISE NOTICE '📊 ATUALIZAÇÃO DE SOURCE_TABLE:';
  RAISE NOTICE '  ✅ painel_servicos: % registros', v_updated_painel_servicos;
  RAISE NOTICE '  ✅ services: % registros', v_updated_services;
  RAISE NOTICE '  ✅ painel_produtos: % registros', v_updated_painel_produtos;
  RAISE NOTICE '  ✅ produtos: % registros', v_updated_produtos;
  
  IF v_orphans > 0 THEN
    RAISE WARNING '  ⚠️ ÓRFÃOS (IDs não encontrados): % registros', v_orphans;
    RAISE WARNING '  💡 Estes podem ser de registros deletados';
  ELSE
    RAISE NOTICE '  ✅ Sem registros órfãos!';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Criar constraint para garantir source_table em novos registros
ALTER TABLE transaction_items 
ADD CONSTRAINT check_source_table_required 
CHECK (source_table IS NOT NULL);

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Constraint adicionada: source_table é obrigatória para novos registros';
END $$;
