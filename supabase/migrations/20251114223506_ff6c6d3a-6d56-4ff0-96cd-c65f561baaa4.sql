-- Atualizar validação de horário para permitir agendamentos até 10 minutos após o horário
-- Exemplo: horário 19:00 fica disponível de 19:00 até 19:10

DROP FUNCTION IF EXISTS validate_appointment_time() CASCADE;

CREATE OR REPLACE FUNCTION validate_appointment_time()
RETURNS TRIGGER AS $$
DECLARE
  appointment_datetime TIMESTAMP;
  min_allowed_time TIMESTAMP;
  current_brazil_time TIMESTAMP;
BEGIN
  -- Pular validação para atualizações que não alteram data/hora
  IF TG_OP = 'UPDATE' THEN
    IF OLD.data = NEW.data AND OLD.hora = NEW.hora THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Obter horário atual do Brasil (UTC-3)
  current_brazil_time := NOW() AT TIME ZONE 'America/Sao_Paulo';
  
  -- Combinar data e hora do agendamento
  appointment_datetime := (NEW.data::TEXT || ' ' || NEW.hora::TEXT)::TIMESTAMP;
  
  -- Calcular tempo mínimo permitido (10 minutos APÓS o horário agendado)
  -- Permite agendar até 10 minutos depois do horário passar
  min_allowed_time := current_brazil_time - INTERVAL '10 minutes';
  
  -- Validar se o horário não passou há mais de 10 minutos
  IF appointment_datetime < min_allowed_time THEN
    RAISE EXCEPTION 'Horário não disponível: já passaram mais de 10 minutos. Horário Brasil: %, Horário solicitado: %, Horário limite: %', 
      current_brazil_time,
      appointment_datetime, 
      min_allowed_time;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER validate_appointment_time_trigger
  BEFORE INSERT OR UPDATE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_time();

-- Comentário atualizado
COMMENT ON FUNCTION validate_appointment_time() IS 'Valida horário de agendamento usando timezone do Brasil. Permite agendamentos até 10 minutos APÓS o horário passar, para flexibilidade com clientes que chegam na hora.';