
-- ============================================================================
-- MIGRATION 4 (CORRIGIDA): Criar e ativar triggers de sincronização
-- ============================================================================

-- Remover triggers antigos se existirem
DO $$
BEGIN
  DROP TRIGGER IF EXISTS services_sync_trigger ON services;
  DROP TRIGGER IF EXISTS painel_servicos_sync_trigger ON painel_servicos;
  RAISE NOTICE '🧹 Triggers antigos removidos (se existiam)';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Nenhum trigger anterior para remover';
END $$;

-- Criar Trigger: services → painel_servicos
CREATE TRIGGER services_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON services
FOR EACH ROW
EXECUTE FUNCTION sync_services_to_painel();

-- Criar Trigger: painel_servicos → services  
CREATE TRIGGER painel_servicos_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON painel_servicos
FOR EACH ROW
EXECUTE FUNCTION sync_painel_to_services();

-- Testar sincronização criando um serviço de teste
DO $$
DECLARE
  v_test_id UUID;
  v_synced_id UUID;
BEGIN
  -- Criar serviço de teste em painel_servicos
  INSERT INTO painel_servicos (nome, preco, duracao, descricao, is_active)
  VALUES ('__TESTE_SYNC__', 1.00, 10, 'Teste de sincronização automática', false)
  RETURNING id INTO v_test_id;
  
  -- Verificar se foi sincronizado para services
  SELECT services_id INTO v_synced_id
  FROM service_id_mapping
  WHERE painel_servicos_id = v_test_id;
  
  IF v_synced_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ TESTE DE SINCRONIZAÇÃO: SUCESSO!';
    RAISE NOTICE '  - Criado em painel_servicos: %', v_test_id;
    RAISE NOTICE '  - Sincronizado para services: %', v_synced_id;
    
    -- Limpar teste
    DELETE FROM painel_servicos WHERE id = v_test_id;
    RAISE NOTICE '  - Teste limpo com sucesso';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '⚠️ TESTE DE SINCRONIZAÇÃO: FALHOU';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Erro no teste de sincronização: %', SQLERRM;
END $$;

-- Log final
DO $$
DECLARE
  v_total_painel INTEGER;
  v_total_services INTEGER;
  v_total_mapping INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_painel FROM painel_servicos;
  SELECT COUNT(*) INTO v_total_services FROM services;
  SELECT COUNT(*) INTO v_total_mapping FROM service_id_mapping;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SINCRONIZAÇÃO AUTOMÁTICA ATIVADA!';
  RAISE NOTICE '  ✅ services → painel_servicos';
  RAISE NOTICE '  ✅ painel_servicos → services';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTADO ATUAL:';
  RAISE NOTICE '  - Serviços em painel_servicos: %', v_total_painel;
  RAISE NOTICE '  - Serviços em services: %', v_total_services;
  RAISE NOTICE '  - Total de mapeamentos: %', v_total_mapping;
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '  1. Atualizar componentes frontend ✅';
  RAISE NOTICE '  2. Atualizar edge functions ✅';
  RAISE NOTICE '  3. Testar fluxo completo ✅';
  RAISE NOTICE '';
END $$;
