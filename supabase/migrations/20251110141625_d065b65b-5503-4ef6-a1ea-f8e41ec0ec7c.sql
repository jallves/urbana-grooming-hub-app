-- Corrigir trigger de validação de horário para usar timezone do Brasil

-- Remover todos os triggers antigos
DROP TRIGGER IF EXISTS validate_appointment_time_trigger ON painel_agendamentos CASCADE;
DROP TRIGGER IF EXISTS trigger_validate_appointment_time ON painel_agendamentos CASCADE;

-- Remover função antiga com CASCADE
DROP FUNCTION IF EXISTS validate_appointment_time() CASCADE;

-- Criar nova função com timezone correto
CREATE OR REPLACE FUNCTION validate_appointment_time()
RETURNS TRIGGER AS $$
DECLARE
  appointment_datetime TIMESTAMP;
  min_allowed_time TIMESTAMP;
  current_brazil_time TIMESTAMP;
BEGIN
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

-- Recriar trigger
CREATE TRIGGER validate_appointment_time_trigger
  BEFORE INSERT OR UPDATE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_time();

-- Comentário
COMMENT ON FUNCTION validate_appointment_time() IS 'Valida horário de agendamento usando timezone do Brasil (America/Sao_Paulo) com 30 minutos de antecedência';