
-- Configurar timezone do Brasil para a sessão e atualizar função de validação
-- Horário de Brasília: America/Sao_Paulo (UTC-3)

-- Atualizar a função de validação para usar horário do Brasil
CREATE OR REPLACE FUNCTION public.validate_appointment_time()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  appointment_datetime TIMESTAMP WITH TIME ZONE;
  min_allowed_time TIMESTAMP WITH TIME ZONE;
  current_brazil_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Pular validação para atualizações que não alteram data/hora
  IF TG_OP = 'UPDATE' THEN
    IF OLD.data = NEW.data AND OLD.hora = NEW.hora THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Obter horário atual do Brasil (America/Sao_Paulo = UTC-3)
  current_brazil_time := NOW() AT TIME ZONE 'America/Sao_Paulo';
  
  -- Combinar data e hora do agendamento e converter para timezone do Brasil
  appointment_datetime := (NEW.data::TEXT || ' ' || NEW.hora::TEXT)::TIMESTAMP AT TIME ZONE 'America/Sao_Paulo';
  
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
$function$;

-- Comentário para documentar
COMMENT ON FUNCTION public.validate_appointment_time() IS 'Valida horários de agendamento usando timezone America/Sao_Paulo (Brasília, UTC-3)';
