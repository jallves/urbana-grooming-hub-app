-- Corrigir função validate_appointment_time para só validar quando data/hora mudam
CREATE OR REPLACE FUNCTION validate_appointment_time()
RETURNS TRIGGER AS $$
DECLARE
  appointment_datetime TIMESTAMP;
  min_allowed_time TIMESTAMP;
  current_brazil_time TIMESTAMP;
BEGIN
  -- Skip validation if only status is being updated (not date/time)
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.data = OLD.data AND NEW.hora = OLD.hora) THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Obter horário atual do Brasil (UTC-3)
  current_brazil_time := NOW() AT TIME ZONE 'America/Sao_Paulo';
  
  -- Combinar data e hora do agendamento
  appointment_datetime := (NEW.data::TEXT || ' ' || NEW.hora::TEXT)::TIMESTAMP;
  
  -- Calcular tempo mínimo permitido (30 minutos de antecedência)
  min_allowed_time := current_brazil_time + INTERVAL '30 minutes';
  
  -- Validar se o horário está no futuro com margem de 30 minutos
  IF appointment_datetime < min_allowed_time THEN
    RAISE EXCEPTION 'Horário inválido: agendamentos devem ser feitos com pelo menos 30 minutos de antecedência. Horário Brasil: %, Horário solicitado: %, Horário mínimo: %', 
      current_brazil_time,
      appointment_datetime, 
      min_allowed_time;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;