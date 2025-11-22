-- Corrigir função check_barber_slot_availability para usar a versão correta de check_unified_slot_availability
CREATE OR REPLACE FUNCTION public.check_barber_slot_availability(
  p_barbeiro_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff_id UUID;
  v_end_time TIME;
  v_has_conflict BOOLEAN;
  v_available_for_booking BOOLEAN;
BEGIN
  -- Buscar staff_id do barbeiro
  SELECT staff_id INTO v_staff_id
  FROM public.painel_barbeiros
  WHERE id = p_barbeiro_id;
  
  IF v_staff_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o barbeiro está disponível para novos agendamentos
  SELECT COALESCE(available_for_booking, true) INTO v_available_for_booking
  FROM public.painel_barbeiros
  WHERE id = p_barbeiro_id;
  
  -- Se não está disponível para booking E não é edição de agendamento existente
  IF NOT v_available_for_booking AND p_exclude_appointment_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Usar a função unificada com 5 parâmetros (versão completa)
  IF NOT check_unified_slot_availability(v_staff_id, p_date, p_time, p_duration, p_exclude_appointment_id) THEN
    -- Se falhou na validação unificada mas é edição, permitir se o barbeiro está marcado como indisponível
    IF p_exclude_appointment_id IS NOT NULL AND NOT v_available_for_booking THEN
      -- Verificar apenas conflitos de horário, ignorando o flag available_for_booking
      v_end_time := p_time + (p_duration || ' minutes')::INTERVAL;
      
      SELECT EXISTS(
        SELECT 1 FROM public.painel_agendamentos
        WHERE barbeiro_id = p_barbeiro_id
        AND data = p_date
        AND status NOT IN ('cancelado', 'ausente')
        AND id != p_exclude_appointment_id
        AND (
          (hora <= p_time AND (hora + (p_duration || ' minutes')::INTERVAL)::TIME > p_time)
          OR (hora < v_end_time AND hora >= p_time)
        )
      ) INTO v_has_conflict;
      
      RETURN NOT v_has_conflict;
    END IF;
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos específicos (excluindo o agendamento sendo editado)
  IF p_exclude_appointment_id IS NOT NULL THEN
    v_end_time := p_time + (p_duration || ' minutes')::INTERVAL;
    
    SELECT EXISTS(
      SELECT 1 FROM public.painel_agendamentos
      WHERE barbeiro_id = p_barbeiro_id
      AND data = p_date
      AND status NOT IN ('cancelado', 'ausente')
      AND id != p_exclude_appointment_id
      AND (
        (hora <= p_time AND (hora + (p_duration || ' minutes')::INTERVAL)::TIME > p_time)
        OR (hora < v_end_time AND hora >= p_time)
      )
    ) INTO v_has_conflict;
    
    RETURN NOT v_has_conflict;
  END IF;
  
  RETURN TRUE;
END;
$$;