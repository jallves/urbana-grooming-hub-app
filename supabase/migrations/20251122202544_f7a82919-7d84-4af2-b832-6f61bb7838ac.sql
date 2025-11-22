-- Atualizar função get_available_time_slots_optimized para filtrar horários passados no dia atual
CREATE OR REPLACE FUNCTION public.get_available_time_slots_optimized(
  p_staff_id UUID,
  p_date DATE,
  p_service_duration INTEGER
)
RETURNS TABLE(time_slot TIME, is_available BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  working_start TIME;
  working_end TIME;
  current_slot TIME;
  slot_interval INTEGER := 30; -- intervalo de 30 minutos
  v_is_available BOOLEAN;
  v_current_time TIME;
  v_current_date DATE;
  v_is_today BOOLEAN;
BEGIN
  -- Obter data e hora atual (timezone Brasil)
  v_current_date := CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo';
  v_current_time := (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::TIME;
  v_is_today := (p_date = v_current_date);
  
  -- Log para debug
  RAISE NOTICE 'get_available_time_slots_optimized: date=%, is_today=%, current_time=%', 
    p_date, v_is_today, v_current_time;
  
  -- Obter horário de trabalho para o dia
  SELECT start_time, end_time INTO working_start, working_end
  FROM working_hours 
  WHERE staff_id = p_staff_id 
    AND day_of_week = EXTRACT(DOW FROM p_date)
    AND is_active = TRUE
  LIMIT 1;
  
  -- Se não há horário de trabalho, retornar vazio
  IF working_start IS NULL THEN
    RAISE NOTICE 'Sem horário de trabalho configurado para este dia';
    RETURN;
  END IF;
  
  -- Gerar slots de tempo
  current_slot := working_start;
  
  WHILE current_slot + (p_service_duration || ' minutes')::INTERVAL <= working_end LOOP
    -- Se for hoje, pular horários que já passaram (com margem de 30 minutos)
    IF v_is_today AND current_slot < (v_current_time + INTERVAL '30 minutes') THEN
      RAISE NOTICE 'Pulando slot % - já passou (hora atual: %)', current_slot, v_current_time;
      current_slot := current_slot + (slot_interval || ' minutes')::INTERVAL;
      CONTINUE;
    END IF;
    
    -- Usar função unificada para verificar disponibilidade
    v_is_available := check_unified_slot_availability(
      p_staff_id, 
      p_date, 
      current_slot, 
      p_service_duration,
      NULL
    );
    
    time_slot := current_slot;
    is_available := v_is_available;
    RETURN NEXT;
    
    current_slot := current_slot + (slot_interval || ' minutes')::INTERVAL;
  END LOOP;
END;
$$;