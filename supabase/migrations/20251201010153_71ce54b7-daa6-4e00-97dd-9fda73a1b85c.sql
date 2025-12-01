
-- Primeiro dropar a versão antiga da função
DROP FUNCTION IF EXISTS public.check_unified_slot_availability(uuid, date, time without time zone, integer);

-- Agora atualizar a versão correta (com 5 parâmetros)
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
SET search_path = public
AS $$
DECLARE
  v_end_time TIME;
  v_weekday INTEGER;
  v_has_schedule BOOLEAN;
  v_is_blocked BOOLEAN;
  v_has_conflict_painel BOOLEAN;
  v_has_conflict_appointments BOOLEAN;
  v_available_for_booking BOOLEAN;
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
  
  -- Calcular horário de término do novo agendamento
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
  
  -- Verificar bloqueios manuais (barber_availability)
  SELECT EXISTS(
    SELECT 1 FROM public.barber_availability ba
    WHERE ba.barber_id = p_staff_id
    AND ba.date = p_date
    AND ba.is_available = false
    AND (
      -- Bloqueio começa durante nosso slot
      (ba.start_time >= p_time AND ba.start_time < v_end_time)
      -- OU bloqueio termina durante nosso slot
      OR (ba.end_time > p_time AND ba.end_time <= v_end_time)
      -- OU bloqueio engloba nosso slot
      OR (ba.start_time <= p_time AND ba.end_time >= v_end_time)
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
    AND is_active = true
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos em painel_agendamentos
  -- SEM buffer excessivo - verificar apenas sobreposição real considerando duração
  SELECT EXISTS(
    SELECT 1 FROM public.painel_agendamentos pa
    INNER JOIN public.painel_barbeiros pb ON pa.barbeiro_id = pb.id
    LEFT JOIN public.painel_servicos ps ON pa.servico_id = ps.id
    WHERE pb.staff_id = p_staff_id
    AND pa.data = p_date
    AND pa.status NOT IN ('cancelado', 'ausente')
    AND (p_exclude_appointment_id IS NULL OR pa.id != p_exclude_appointment_id)
    AND (
      -- Novo slot começa durante agendamento existente
      (p_time >= pa.hora AND p_time < (pa.hora + (COALESCE(ps.duracao, 30) * INTERVAL '1 minute')))
      -- OU novo slot termina durante agendamento existente
      OR (v_end_time > pa.hora AND v_end_time <= (pa.hora + (COALESCE(ps.duracao, 30) * INTERVAL '1 minute')))
      -- OU novo slot engloba agendamento existente
      OR (p_time <= pa.hora AND v_end_time >= (pa.hora + (COALESCE(ps.duracao, 30) * INTERVAL '1 minute')))
    )
  ) INTO v_has_conflict_painel;
  
  IF v_has_conflict_painel THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos em appointments (sistema legado)
  SELECT EXISTS(
    SELECT 1 FROM public.appointments a
    WHERE a.staff_id = p_staff_id
    AND a.start_time::DATE = p_date
    AND a.status NOT IN ('cancelled', 'canceled', 'ausente')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (
      -- Novo slot começa durante agendamento existente
      (p_time >= a.start_time::TIME AND p_time < a.end_time::TIME)
      -- OU novo slot termina durante agendamento existente
      OR (v_end_time > a.start_time::TIME AND v_end_time <= a.end_time::TIME)
      -- OU novo slot engloba agendamento existente
      OR (p_time <= a.start_time::TIME AND v_end_time >= a.end_time::TIME)
    )
  ) INTO v_has_conflict_appointments;
  
  IF v_has_conflict_appointments THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.check_unified_slot_availability(uuid, date, time, integer, uuid) TO authenticated, anon;
