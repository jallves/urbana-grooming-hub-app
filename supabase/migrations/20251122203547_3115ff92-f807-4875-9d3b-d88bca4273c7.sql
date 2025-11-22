-- Corrigir função check_unified_slot_availability com 5 parâmetros para verificar available_for_booking
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
SET search_path TO 'public'
AS $$
DECLARE
  v_end_time TIME;
  v_weekday INTEGER;
  v_has_schedule BOOLEAN;
  v_has_conflict_painel BOOLEAN;
  v_has_conflict_appointments BOOLEAN;
  v_available_for_booking BOOLEAN;
  BUFFER_MINUTES CONSTANT INTEGER := 10;
BEGIN
  -- CRÍTICO: Verificar se o barbeiro está disponível para novos agendamentos
  -- APENAS para novos agendamentos (quando p_exclude_appointment_id é NULL)
  IF p_exclude_appointment_id IS NULL THEN
    SELECT COALESCE(pb.available_for_booking, true) INTO v_available_for_booking
    FROM public.painel_barbeiros pb
    WHERE pb.staff_id = p_staff_id;
    
    -- Se não está disponível para novos agendamentos, retornar false
    IF NOT v_available_for_booking THEN
      RAISE NOTICE 'Barbeiro % não está disponível para novos agendamentos (available_for_booking=false)', p_staff_id;
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Calcular horário de término do novo agendamento
  v_end_time := p_time + (p_duration_minutes * INTERVAL '1 minute');
  v_weekday := EXTRACT(DOW FROM p_date);
  
  -- Verificar se o barbeiro trabalha neste dia/horário
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
  
  -- Verificar conflitos na tabela painel_agendamentos
  SELECT EXISTS(
    SELECT 1 FROM public.painel_agendamentos pa
    INNER JOIN public.painel_barbeiros pb ON pa.barbeiro_id = pb.id
    LEFT JOIN public.painel_servicos ps ON pa.servico_id = ps.id
    WHERE pb.staff_id = p_staff_id
    AND pa.data = p_date
    AND pa.status NOT IN ('cancelado', 'CANCELADO')
    AND (p_exclude_appointment_id IS NULL OR pa.id != p_exclude_appointment_id)
    AND (
      (pa.hora < v_end_time 
       AND (pa.hora + COALESCE(ps.duracao, 60) * INTERVAL '1 minute' + INTERVAL '10 minutes') > p_time)
    )
  ) INTO v_has_conflict_painel;
  
  IF v_has_conflict_painel THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos na tabela appointments
  SELECT EXISTS(
    SELECT 1 FROM public.appointments a
    WHERE a.staff_id = p_staff_id
    AND DATE(a.start_time) = p_date
    AND a.status NOT IN ('cancelled', 'canceled')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      (a.start_time::TIME < v_end_time 
       AND (a.end_time + INTERVAL '10 minutes')::TIME > p_time)
    )
  ) INTO v_has_conflict_appointments;
  
  IF v_has_conflict_appointments THEN
    RETURN FALSE;
  END IF;
  
  -- Se passou por todas as verificações, o horário está disponível
  RETURN TRUE;
END;
$$;