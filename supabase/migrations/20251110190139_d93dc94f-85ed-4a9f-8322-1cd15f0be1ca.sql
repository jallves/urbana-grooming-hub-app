-- Corrigir trigger de conflito para permitir atualizações apenas de status
DROP TRIGGER IF EXISTS trigger_check_appointment_conflict ON painel_agendamentos;
DROP FUNCTION IF EXISTS check_appointment_conflict();

CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
  service_duration INTEGER;
  appointment_start TIME;
  appointment_end TIME;
  conflict_record RECORD;
BEGIN
  -- Se está apenas atualizando status (status, status_totem, updated_at), permitir sem validação
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se apenas campos de status/timestamp foram alterados
    IF (NEW.data = OLD.data AND 
        NEW.hora = OLD.hora AND 
        NEW.barbeiro_id = OLD.barbeiro_id AND 
        NEW.servico_id = OLD.servico_id AND
        NEW.cliente_id = OLD.cliente_id) THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Buscar duração do serviço
  SELECT duracao INTO service_duration
  FROM painel_servicos
  WHERE id = NEW.servico_id;
  
  IF service_duration IS NULL THEN
    service_duration := 60;
  END IF;
  
  -- Calcular horário de início e fim
  appointment_start := NEW.hora::TIME;
  appointment_end := (appointment_start + (service_duration || ' minutes')::INTERVAL)::TIME;
  
  -- Verificar conflitos com outros agendamentos
  FOR conflict_record IN
    SELECT 
      a.id,
      a.hora,
      s.duracao,
      (a.hora::TIME + (COALESCE(s.duracao, 60) || ' minutes')::INTERVAL)::TIME as fim
    FROM painel_agendamentos a
    JOIN painel_servicos s ON a.servico_id = s.id
    WHERE a.barbeiro_id = NEW.barbeiro_id
      AND a.data = NEW.data
      AND a.status != 'cancelado'
      AND (TG_OP = 'INSERT' OR a.id != NEW.id)
  LOOP
    -- Verificar sobreposição de horários
    IF (appointment_start < conflict_record.fim) AND 
       (appointment_end > conflict_record.hora::TIME) THEN
      RAISE EXCEPTION 'Conflito de horário detectado: já existe um agendamento às % para este barbeiro nesta data. Novo agendamento solicitado: % - %, Agendamento existente: % - %',
        conflict_record.hora,
        appointment_start,
        appointment_end,
        conflict_record.hora,
        conflict_record.fim;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_appointment_conflict
  BEFORE INSERT OR UPDATE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_conflict();