-- Atualizar função check_barber_slot_availability para considerar bloqueios manuais
CREATE OR REPLACE FUNCTION public.check_barber_slot_availability(
  p_barbeiro_id UUID,
  p_date DATE,
  p_time TEXT,
  p_duration INTEGER,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff_id UUID;
  v_time TIME;
  v_end_time TIME;
  v_weekday INTEGER;
  v_has_schedule BOOLEAN;
  v_is_blocked BOOLEAN;
  v_has_conflict BOOLEAN;
  v_available_for_booking BOOLEAN;
BEGIN
  -- Converter time string para TIME
  v_time := p_time::TIME;
  v_end_time := v_time + (p_duration * INTERVAL '1 minute');
  v_weekday := EXTRACT(DOW FROM p_date);
  
  -- Buscar staff_id do barbeiro
  SELECT staff_id, COALESCE(available_for_booking, true)
  INTO v_staff_id, v_available_for_booking
  FROM public.painel_barbeiros
  WHERE id = p_barbeiro_id;
  
  IF v_staff_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se está disponível para novos agendamentos
  IF p_exclude_appointment_id IS NULL AND NOT v_available_for_booking THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar horário de trabalho
  SELECT EXISTS(
    SELECT 1 FROM public.working_hours
    WHERE staff_id = v_staff_id
    AND day_of_week = v_weekday
    AND is_active = true
    AND v_time >= start_time
    AND v_end_time <= end_time
  ) INTO v_has_schedule;
  
  IF NOT v_has_schedule THEN
    RETURN FALSE;
  END IF;
  
  -- NOVO: Verificar bloqueios manuais na tabela barber_availability
  SELECT EXISTS(
    SELECT 1 FROM public.barber_availability ba
    WHERE ba.barber_id = v_staff_id
    AND ba.date = p_date
    AND ba.is_available = false
    AND (
      -- Verifica sobreposição: slot bloqueado sobrepõe o horário solicitado
      (ba.start_time <= v_time AND ba.end_time > v_time)
      OR (ba.start_time < v_end_time AND ba.end_time >= v_end_time)
      OR (ba.start_time >= v_time AND ba.end_time <= v_end_time)
    )
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar folgas (time_off)
  IF EXISTS(
    SELECT 1 FROM public.time_off
    WHERE staff_id = v_staff_id
    AND p_date BETWEEN start_date AND end_date
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos com outros agendamentos
  SELECT EXISTS(
    SELECT 1 FROM public.painel_agendamentos pa
    INNER JOIN public.painel_servicos ps ON pa.servico_id = ps.id
    WHERE pa.barbeiro_id = p_barbeiro_id
    AND pa.data = p_date
    AND pa.status NOT IN ('cancelado', 'ausente')
    AND (p_exclude_appointment_id IS NULL OR pa.id != p_exclude_appointment_id)
    AND (
      (pa.hora <= v_time AND (pa.hora + (ps.duracao * INTERVAL '1 minute')) > v_time)
      OR (pa.hora < v_end_time AND (pa.hora + (ps.duracao * INTERVAL '1 minute')) >= v_end_time)
      OR (pa.hora >= v_time AND (pa.hora + (ps.duracao * INTERVAL '1 minute')) <= v_end_time)
    )
  ) INTO v_has_conflict;
  
  RETURN NOT v_has_conflict;
END;
$$;

-- Atualizar check_unified_slot_availability para considerar bloqueios
CREATE OR REPLACE FUNCTION public.check_unified_slot_availability(
  p_staff_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration_minutes INTEGER,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end_time TIME;
  v_weekday INTEGER;
  v_has_schedule BOOLEAN;
  v_is_blocked BOOLEAN;
  v_has_conflict_painel BOOLEAN;
  v_has_conflict_appointments BOOLEAN;
  v_available_for_booking BOOLEAN;
  BUFFER_MINUTES CONSTANT INTEGER := 10;
BEGIN
  -- Verificar disponibilidade para novos agendamentos
  IF p_exclude_appointment_id IS NULL THEN
    SELECT COALESCE(pb.available_for_booking, true) INTO v_available_for_booking
    FROM public.painel_barbeiros pb
    WHERE pb.staff_id = p_staff_id;
    
    IF NOT v_available_for_booking THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Calcular horário de término
  v_end_time := p_time + (p_duration_minutes * INTERVAL '1 minute');
  v_weekday := EXTRACT(DOW FROM p_date);
  
  -- Verificar horário de trabalho
  SELECT EXISTS(
    SELECT 1 FROM public.working_hours
    WHERE staff_id = p_staff_id
    AND day_of_week = v_weekday
    AND is_active = true
    AND p_time >= start_time
    AND v_end_time <= end_time
  ) INTO v_has_schedule;
  
  IF NOT v_has_schedule THEN
    RETURN FALSE;
  END IF;
  
  -- NOVO: Verificar bloqueios manuais
  SELECT EXISTS(
    SELECT 1 FROM public.barber_availability ba
    WHERE ba.barber_id = p_staff_id
    AND ba.date = p_date
    AND ba.is_available = false
    AND (
      (ba.start_time <= p_time AND ba.end_time > p_time)
      OR (ba.start_time < v_end_time AND ba.end_time >= v_end_time)
      OR (ba.start_time >= p_time AND ba.end_time <= v_end_time)
    )
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar folgas
  IF EXISTS(
    SELECT 1 FROM public.time_off
    WHERE staff_id = p_staff_id
    AND p_date BETWEEN start_date AND end_date
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos em painel_agendamentos
  SELECT EXISTS(
    SELECT 1 FROM public.painel_agendamentos pa
    INNER JOIN public.painel_barbeiros pb ON pa.barbeiro_id = pb.id
    LEFT JOIN public.painel_servicos ps ON pa.servico_id = ps.id
    WHERE pb.staff_id = p_staff_id
    AND pa.data = p_date
    AND pa.status NOT IN ('cancelado', 'ausente')
    AND (p_exclude_appointment_id IS NULL OR pa.id != p_exclude_appointment_id)
    AND (
      (pa.hora <= p_time AND (pa.hora + ((COALESCE(ps.duracao, 30) + BUFFER_MINUTES) * INTERVAL '1 minute')) > p_time)
      OR (pa.hora < v_end_time AND (pa.hora + ((COALESCE(ps.duracao, 30) + BUFFER_MINUTES) * INTERVAL '1 minute')) >= v_end_time)
      OR (pa.hora >= p_time AND pa.hora < v_end_time)
    )
  ) INTO v_has_conflict_painel;
  
  IF v_has_conflict_painel THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos em appointments
  SELECT EXISTS(
    SELECT 1 FROM public.appointments a
    WHERE a.staff_id = p_staff_id
    AND DATE(a.start_time) = p_date
    AND a.status IN ('scheduled', 'confirmed')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      a.start_time::TIME <= p_time AND a.end_time::TIME > p_time
      OR a.start_time::TIME < v_end_time AND a.end_time::TIME >= v_end_time
      OR a.start_time::TIME >= p_time AND a.start_time::TIME < v_end_time
    )
  ) INTO v_has_conflict_appointments;
  
  RETURN NOT v_has_conflict_appointments;
END;
$$;