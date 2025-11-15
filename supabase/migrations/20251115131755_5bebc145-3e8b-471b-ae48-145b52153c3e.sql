-- Criar ou substituir função que retorna todos os slots disponíveis de uma vez
-- Usa check_unified_slot_availability para garantir consistência entre sistemas

CREATE OR REPLACE FUNCTION public.get_available_time_slots_optimized(
  p_staff_id UUID,
  p_date DATE,
  p_service_duration INTEGER
)
RETURNS TABLE(
  time_slot TIME,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  working_start TIME;
  working_end TIME;
  current_slot TIME;
  slot_interval INTEGER := 30; -- intervalo de 30 minutos
  v_is_available BOOLEAN;
BEGIN
  -- Obter horário de trabalho para o dia
  SELECT start_time, end_time INTO working_start, working_end
  FROM working_hours 
  WHERE staff_id = p_staff_id 
    AND day_of_week = EXTRACT(DOW FROM p_date)
    AND is_active = TRUE
  LIMIT 1;
  
  -- Se não há horário de trabalho, retornar vazio
  IF working_start IS NULL THEN
    RETURN;
  END IF;
  
  -- Gerar slots de tempo
  current_slot := working_start;
  
  WHILE current_slot + (p_service_duration || ' minutes')::INTERVAL <= working_end LOOP
    -- Usar função unificada para verificar disponibilidade
    v_is_available := check_unified_slot_availability(
      p_staff_id, 
      p_date, 
      current_slot, 
      p_service_duration
    );
    
    time_slot := current_slot;
    is_available := v_is_available;
    RETURN NEXT;
    
    current_slot := current_slot + (slot_interval || ' minutes')::INTERVAL;
  END LOOP;
END;
$$;