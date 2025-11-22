-- Adicionar coluna available_for_booking na tabela painel_barbeiros
ALTER TABLE public.painel_barbeiros
ADD COLUMN IF NOT EXISTS available_for_booking BOOLEAN DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN public.painel_barbeiros.available_for_booking IS 
'Controla se o barbeiro aparece como disponível para NOVOS agendamentos. 
Não afeta agendamentos existentes, totem, vendas de produtos ou comissões.';

-- Atualizar função check_unified_slot_availability para respeitar o flag
CREATE OR REPLACE FUNCTION public.check_unified_slot_availability(
  p_staff_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end_time TIME;
  v_weekday INTEGER;
  v_has_working_hours BOOLEAN;
  v_has_time_off BOOLEAN;
  v_has_conflict BOOLEAN;
  v_available_for_booking BOOLEAN;
BEGIN
  -- Verificar se o barbeiro está disponível para novos agendamentos
  SELECT COALESCE(pb.available_for_booking, true) INTO v_available_for_booking
  FROM public.painel_barbeiros pb
  WHERE pb.staff_id = p_staff_id;
  
  -- Se não está disponível para booking, retornar false imediatamente
  IF NOT v_available_for_booking THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular horário de término
  v_end_time := p_time + (p_duration || ' minutes')::INTERVAL;
  v_weekday := EXTRACT(DOW FROM p_date);
  
  -- Verificar se existe horário de trabalho cadastrado para este dia
  SELECT EXISTS(
    SELECT 1 FROM public.working_hours
    WHERE staff_id = p_staff_id
    AND day_of_week = v_weekday
    AND is_active = true
    AND p_time >= start_time
    AND v_end_time <= end_time
  ) INTO v_has_working_hours;
  
  IF NOT v_has_working_hours THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se há ausência programada (time_off)
  SELECT EXISTS(
    SELECT 1 FROM public.time_off
    WHERE staff_id = p_staff_id
    AND p_date >= start_date
    AND p_date <= end_date
    AND is_active = true
  ) INTO v_has_time_off;
  
  IF v_has_time_off THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos com agendamentos existentes
  SELECT EXISTS(
    SELECT 1 FROM public.painel_agendamentos
    WHERE barbeiro_id IN (
      SELECT id FROM public.painel_barbeiros WHERE staff_id = p_staff_id
    )
    AND data = p_date
    AND status NOT IN ('cancelado', 'ausente')
    AND (
      (hora <= p_time AND (hora + (p_duration || ' minutes')::INTERVAL)::TIME > p_time)
      OR (hora < v_end_time AND hora >= p_time)
    )
  ) INTO v_has_conflict;
  
  RETURN NOT v_has_conflict;
END;
$$;

-- Dropar função antiga e recriar com novos parâmetros
DROP FUNCTION IF EXISTS public.check_barber_slot_availability(uuid, date, time, integer, uuid);

CREATE FUNCTION public.check_barber_slot_availability(
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
  
  -- Usar a função unificada para o resto da validação
  IF NOT check_unified_slot_availability(v_staff_id, p_date, p_time, p_duration) THEN
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