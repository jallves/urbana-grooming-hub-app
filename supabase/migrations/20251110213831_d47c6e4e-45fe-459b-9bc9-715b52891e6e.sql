
-- ============================================================================
-- MIGRATION 3: Criar funções de sincronização bidirecional
-- ============================================================================

-- 1. Sincronizar de services → painel_servicos
CREATE OR REPLACE FUNCTION sync_services_to_painel()
RETURNS TRIGGER AS $$
DECLARE
  painel_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Verificar se já existe serviço similar
    SELECT id INTO painel_id
    FROM painel_servicos
    WHERE LOWER(TRIM(nome)) = LOWER(TRIM(NEW.name))
    LIMIT 1;
    
    IF painel_id IS NULL THEN
      -- Criar novo serviço em painel_servicos
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
        NEW.name,
        NEW.price,
        NEW.duration,
        NEW.description,
        NEW.is_active,
        true,
        0
      )
      RETURNING id INTO painel_id;
      
      -- Criar mapeamento
      INSERT INTO service_id_mapping (services_id, painel_servicos_id)
      VALUES (NEW.id, painel_id)
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE '✅ Serviço % sincronizado: services → painel_servicos', NEW.name;
    ELSE
      -- Apenas criar mapeamento se não existir
      INSERT INTO service_id_mapping (services_id, painel_servicos_id)
      VALUES (NEW.id, painel_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar serviço correspondente em painel_servicos
    UPDATE painel_servicos ps
    SET 
      nome = NEW.name,
      preco = NEW.price,
      duracao = NEW.duration,
      descricao = NEW.description,
      is_active = NEW.is_active,
      updated_at = NOW()
    WHERE ps.id IN (
      SELECT painel_servicos_id 
      FROM service_id_mapping 
      WHERE services_id = NEW.id
    );
    
    RAISE NOTICE '✅ Serviço % atualizado em painel_servicos', NEW.name;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remover mapeamento (mas não deletar de painel_servicos)
    DELETE FROM service_id_mapping WHERE services_id = OLD.id;
    RAISE NOTICE '⚠️ Mapeamento removido para serviço %', OLD.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Sincronizar de painel_servicos → services
CREATE OR REPLACE FUNCTION sync_painel_to_services()
RETURNS TRIGGER AS $$
DECLARE
  service_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Verificar se já existe serviço similar
    SELECT id INTO service_id
    FROM services
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.nome))
    LIMIT 1;
    
    IF service_id IS NULL THEN
      -- Criar novo serviço em services
      INSERT INTO services (
        name,
        price,
        duration,
        description,
        is_active
      )
      VALUES (
        NEW.nome,
        NEW.preco,
        NEW.duracao,
        NEW.descricao,
        NEW.is_active
      )
      RETURNING id INTO service_id;
      
      -- Criar mapeamento
      INSERT INTO service_id_mapping (painel_servicos_id, services_id)
      VALUES (NEW.id, service_id)
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE '✅ Serviço % sincronizado: painel_servicos → services', NEW.nome;
    ELSE
      -- Apenas criar mapeamento se não existir
      INSERT INTO service_id_mapping (painel_servicos_id, services_id)
      VALUES (NEW.id, service_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar serviço correspondente em services
    UPDATE services s
    SET 
      name = NEW.nome,
      price = NEW.preco,
      duration = NEW.duracao,
      description = NEW.descricao,
      is_active = NEW.is_active,
      updated_at = NOW()
    WHERE s.id IN (
      SELECT services_id 
      FROM service_id_mapping 
      WHERE painel_servicos_id = NEW.id
    );
    
    RAISE NOTICE '✅ Serviço % atualizado em services', NEW.nome;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Remover mapeamento (mas não deletar de services)
    DELETE FROM service_id_mapping WHERE painel_servicos_id = OLD.id;
    RAISE NOTICE '⚠️ Mapeamento removido para serviço %', OLD.nome;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ Funções de sincronização criadas';
END $$;
