-- Substituir as funções de sincronização com proteção contra loop
CREATE OR REPLACE FUNCTION sync_services_to_painel()
RETURNS TRIGGER AS $$
BEGIN
  -- Proteção contra recursão: apenas executar se não estivermos já dentro de um trigger
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Sincronizar dados
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_painel_to_services()
RETURNS TRIGGER AS $$
BEGIN
  -- Proteção contra recursão: apenas executar se não estivermos já dentro de um trigger
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Sincronizar dados
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Agora atualizar os preços e durações
UPDATE painel_servicos SET preco = 90.00, duracao = 60 WHERE nome = 'Corte + Barba';
UPDATE painel_servicos SET preco = 110.00, duracao = 60 WHERE nome = 'Corte + Barba + Sobrancelha';
UPDATE painel_servicos SET preco = 70.00, duracao = 30 WHERE nome = 'Corte + Sobrancelha';
UPDATE painel_servicos SET preco = 120.00, duracao = 90 WHERE nome = 'Corte + Tonalização';
UPDATE painel_servicos SET preco = 55.00, duracao = 30 WHERE nome = 'Depilação Perna Inteira';
UPDATE painel_servicos SET preco = 210.00, duracao = 120 WHERE nome = 'Detox com Manta + Massagem';
UPDATE painel_servicos SET preco = 120.00, duracao = 60 WHERE nome = 'Detox Corporal com Manta Térmica';
UPDATE painel_servicos SET preco = 120.00, duracao = 90 WHERE nome = 'Drenagem Linfática';
UPDATE painel_servicos SET preco = 50.00, duracao = 45 WHERE nome = 'Hidratação';
UPDATE painel_servicos SET preco = 90.00, duracao = 45 WHERE nome = 'Hidratação V.O';
UPDATE painel_servicos SET preco = 120.00, duracao = 60 WHERE nome = 'Limpeza de Pele';
UPDATE painel_servicos SET preco = 130.00, duracao = 120 WHERE nome = 'Luzes';
UPDATE painel_servicos SET preco = 120.00, duracao = 90 WHERE nome = 'Massagem Desportiva';
UPDATE painel_servicos SET preco = 60.00, duracao = 60 WHERE nome = 'Massagem Podal';
UPDATE painel_servicos SET preco = 120.00, duracao = 90 WHERE nome = 'Massagem Relaxante';
UPDATE painel_servicos SET preco = 20.00, duracao = 30 WHERE nome = 'Pezinho';
UPDATE painel_servicos SET preco = 180.00, duracao = 120 WHERE nome = 'Platinado';
UPDATE painel_servicos SET preco = 35.00, duracao = 30 WHERE nome = 'Quick Massage';
UPDATE painel_servicos SET preco = 110.00, duracao = 60 WHERE nome = 'Revitalização Facial';
UPDATE painel_servicos SET preco = 130.00, duracao = 60 WHERE nome = 'Selagem';
UPDATE painel_servicos SET preco = 170.00, duracao = 90 WHERE nome = 'Selagem + Corte';
UPDATE painel_servicos SET preco = 25.00, duracao = 15 WHERE nome = 'Sobrancelha';
UPDATE painel_servicos SET preco = 50.00, duracao = 30 WHERE nome = 'Sobrancelha Egípcia';
UPDATE painel_servicos SET preco = 40.00, duracao = 30 WHERE nome = 'Sobrancelha Pinça';
UPDATE painel_servicos SET preco = 80.00, duracao = 60 WHERE nome = 'Spa dos Pés';
UPDATE painel_servicos SET preco = 80.00, duracao = 60 WHERE nome = 'Tonalização Barba';
UPDATE painel_servicos SET preco = 80.00, duracao = 60 WHERE nome = 'Tonalização Cabelo';