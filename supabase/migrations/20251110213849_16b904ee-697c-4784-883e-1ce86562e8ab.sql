
-- ============================================================================
-- MIGRATION 5: Migrar serviços faltantes entre tabelas
-- ============================================================================

-- 1. Copiar serviços de painel_servicos para services (se não existir)
DO $$
DECLARE
  v_count INTEGER := 0;
  v_service RECORD;
  v_new_service_id UUID;
BEGIN
  FOR v_service IN 
    SELECT ps.*
    FROM painel_servicos ps
    WHERE NOT EXISTS (
      SELECT 1 FROM services s 
      WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(ps.nome))
    )
  LOOP
    -- Inserir em services
    INSERT INTO services (name, price, duration, description, is_active)
    VALUES (
      v_service.nome,
      v_service.preco,
      v_service.duracao,
      v_service.descricao,
      COALESCE(v_service.is_active, true)
    )
    RETURNING id INTO v_new_service_id;
    
    -- Criar mapeamento
    INSERT INTO service_id_mapping (painel_servicos_id, services_id)
    VALUES (v_service.id, v_new_service_id)
    ON CONFLICT DO NOTHING;
    
    v_count := v_count + 1;
    RAISE NOTICE '✅ Migrado: % (painel → services)', v_service.nome;
  END LOOP;
  
  RAISE NOTICE '✅ Total migrado painel → services: % serviços', v_count;
END $$;

-- 2. Copiar serviços de services para painel_servicos (se não existir)
DO $$
DECLARE
  v_count INTEGER := 0;
  v_service RECORD;
  v_new_painel_id UUID;
BEGIN
  FOR v_service IN 
    SELECT s.*
    FROM services s
    WHERE NOT EXISTS (
      SELECT 1 FROM painel_servicos ps 
      WHERE LOWER(TRIM(ps.nome)) = LOWER(TRIM(s.name))
    )
  LOOP
    -- Inserir em painel_servicos
    INSERT INTO painel_servicos (
      nome, 
      preco, 
      duracao, 
      descricao, 
      is_active,
      show_on_home,
      display_order
    )
    VALUES (
      v_service.name,
      v_service.price,
      v_service.duration,
      v_service.description,
      COALESCE(v_service.is_active, true),
      true,
      0
    )
    RETURNING id INTO v_new_painel_id;
    
    -- Criar mapeamento
    INSERT INTO service_id_mapping (painel_servicos_id, services_id)
    VALUES (v_new_painel_id, v_service.id)
    ON CONFLICT DO NOTHING;
    
    v_count := v_count + 1;
    RAISE NOTICE '✅ Migrado: % (services → painel)', v_service.name;
  END LOOP;
  
  RAISE NOTICE '✅ Total migrado services → painel: % serviços', v_count;
END $$;

-- 3. Criar mapeamentos para serviços já existentes em ambas tabelas
DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO service_id_mapping (painel_servicos_id, services_id)
  SELECT ps.id, s.id
  FROM painel_servicos ps
  JOIN services s ON LOWER(TRIM(ps.nome)) = LOWER(TRIM(s.name))
  WHERE NOT EXISTS (
    SELECT 1 FROM service_id_mapping m
    WHERE m.painel_servicos_id = ps.id 
    AND m.services_id = s.id
  );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✅ Mapeamentos criados para serviços existentes: %', v_count;
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
  RAISE NOTICE '📊 RESUMO DA MIGRAÇÃO:';
  RAISE NOTICE '  - Total em painel_servicos: %', v_total_painel;
  RAISE NOTICE '  - Total em services: %', v_total_services;
  RAISE NOTICE '  - Total de mapeamentos: %', v_total_mapping;
  RAISE NOTICE '';
END $$;
