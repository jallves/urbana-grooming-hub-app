-- Criar função unificada para verificar disponibilidade de horários
-- Esta função verifica TODAS as fontes de agendamento: painel_agendamentos e appointments

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
  v_has_conflict_painel BOOLEAN;
  v_has_conflict_appointments BOOLEAN;
BEGIN
  -- Calcular horário de término
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
  
  -- Verificar conflitos na tabela painel_agendamentos (Totem e Painel Cliente)
  SELECT EXISTS(
    SELECT 1 FROM public.painel_agendamentos pa
    INNER JOIN public.painel_barbeiros pb ON pa.barbeiro_id = pb.id
    WHERE pb.staff_id = p_staff_id
    AND pa.data = p_date
    AND pa.status NOT IN ('cancelado', 'CANCELADO')
    AND (p_exclude_appointment_id IS NULL OR pa.id != p_exclude_appointment_id)
    AND (
      -- Verificar sobreposição de horários
      (pa.hora <= p_time AND (pa.hora + INTERVAL '60 minutes') > p_time)
      OR (pa.hora < v_end_time AND pa.hora >= p_time)
    )
  ) INTO v_has_conflict_painel;
  
  IF v_has_conflict_painel THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos na tabela appointments (Painel Admin)
  SELECT EXISTS(
    SELECT 1 FROM public.appointments a
    WHERE a.staff_id = p_staff_id
    AND DATE(a.start_time) = p_date
    AND a.status NOT IN ('cancelled', 'canceled')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      -- Verificar sobreposição de horários
      (a.start_time::TIME <= p_time AND a.end_time::TIME > p_time)
      OR (a.start_time::TIME < v_end_time AND a.start_time::TIME >= p_time)
    )
  ) INTO v_has_conflict_appointments;
  
  IF v_has_conflict_appointments THEN
    RETURN FALSE;
  END IF;
  
  -- Se passou por todas as verificações, o horário está disponível
  RETURN TRUE;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.check_unified_slot_availability IS 
'Verifica disponibilidade de horários considerando TODAS as fontes de agendamento (painel_agendamentos e appointments). Garante que agendamentos feitos no Totem, Painel do Cliente ou Painel Admin sejam respeitados em todos os sistemas.';
