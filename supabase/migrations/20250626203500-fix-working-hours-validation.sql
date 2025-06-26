
-- Corrigir função de validação de agendamento
CREATE OR REPLACE FUNCTION public.validate_appointment_booking(
  p_client_id UUID,
  p_staff_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_conflict_count INTEGER;
  v_working_hours RECORD;
  v_day_of_week INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_has_working_hours BOOLEAN;
BEGIN
  -- Log para debug
  RAISE NOTICE 'Validando agendamento: staff_id=%, start_time=%, end_time=%', p_staff_id, p_start_time, p_end_time;
  
  -- Verificar se há conflitos de agendamento
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE staff_id = p_staff_id
  AND (
    (start_time < p_end_time AND end_time > p_start_time)
  )
  AND status IN ('scheduled', 'confirmed')
  AND id != COALESCE(NULL, gen_random_uuid()); -- Para updates futuros
  
  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Barbeiro já possui agendamento neste horário'
    );
  END IF;
  
  -- Verificar horário de trabalho
  v_day_of_week := EXTRACT(DOW FROM p_start_time::DATE);
  v_start_time := p_start_time::TIME;
  v_end_time := p_end_time::TIME;
  
  RAISE NOTICE 'Verificando horário: day_of_week=%, start_time=%, end_time=%', v_day_of_week, v_start_time, v_end_time;
  
  -- Verificar se existe horário de trabalho configurado
  SELECT COUNT(*) > 0 INTO v_has_working_hours
  FROM working_hours
  WHERE staff_id = p_staff_id
  AND day_of_week = v_day_of_week
  AND is_active = TRUE;
  
  IF v_has_working_hours THEN
    -- Se tem horário configurado, verificar se está dentro do horário
    SELECT * INTO v_working_hours
    FROM working_hours
    WHERE staff_id = p_staff_id
    AND day_of_week = v_day_of_week
    AND is_active = TRUE
    LIMIT 1;
    
    RAISE NOTICE 'Horário encontrado: start=%, end=%', v_working_hours.start_time, v_working_hours.end_time;
    
    IF v_start_time < v_working_hours.start_time OR v_end_time > v_working_hours.end_time THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Horário fora do expediente do barbeiro'
      );
    END IF;
  ELSE
    -- Se não tem horário configurado, usar horário padrão (seg-sab 09:00-20:00)
    -- Domingo = 0, não trabalha
    IF v_day_of_week = 0 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Barbeiro não trabalha aos domingos'
      );
    END IF;
    
    -- Verificar horário padrão (09:00 às 20:00)
    IF v_start_time < '09:00:00'::TIME OR v_end_time > '20:00:00'::TIME THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Horário fora do expediente padrão (09:00-20:00)'
      );
    END IF;
  END IF;
  
  -- Verificar disponibilidade específica (se existir)
  IF EXISTS (
    SELECT 1 FROM barber_availability
    WHERE barber_id = p_staff_id
    AND date = p_start_time::DATE
  ) THEN
    -- Se existe entrada para o dia, verificar se está disponível
    IF NOT EXISTS (
      SELECT 1 FROM barber_availability
      WHERE barber_id = p_staff_id
      AND date = p_start_time::DATE
      AND is_available = TRUE
      AND v_start_time >= start_time
      AND v_end_time <= end_time
    ) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Barbeiro não está disponível neste horário específico'
      );
    END IF;
  END IF;
  
  RAISE NOTICE 'Validação passou - agendamento válido';
  
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Agendamento válido'
  );
END;
$$;
