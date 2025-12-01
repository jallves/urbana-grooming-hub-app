
-- Atualizar função para considerar bloqueios da tabela barber_availability
CREATE OR REPLACE FUNCTION get_barbeiro_horarios_disponiveis(
  p_barbeiro_id UUID,
  p_data DATE,
  p_duracao_minutos INTEGER DEFAULT 30
)
RETURNS TABLE(
  horario TIME,
  disponivel BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dia_semana INTEGER;
  v_horario_inicio TIME;
  v_horario_fim TIME;
  v_horario_atual TIME;
  v_now TIMESTAMP;
  v_staff_id UUID;
BEGIN
  -- Obter dia da semana (0 = domingo, 6 = sábado)
  v_dia_semana := EXTRACT(DOW FROM p_data);
  v_now := NOW();
  
  -- Obter o staff_id correspondente ao barbeiro do painel
  SELECT pb.staff_id INTO v_staff_id
  FROM painel_barbeiros pb
  WHERE pb.id = p_barbeiro_id;
  
  -- Buscar horário de trabalho do barbeiro para este dia
  SELECT hora_inicio, hora_fim 
  INTO v_horario_inicio, v_horario_fim
  FROM painel_horarios_barbeiro
  WHERE barbeiro_id = p_barbeiro_id
    AND dia_semana = v_dia_semana
    AND ativo = true;
  
  -- Se não há horário de trabalho, retornar vazio
  IF v_horario_inicio IS NULL THEN
    RETURN;
  END IF;
  
  -- Gerar slots de horário de 30 em 30 minutos
  v_horario_atual := v_horario_inicio;
  
  WHILE v_horario_atual + (p_duracao_minutos || ' minutes')::INTERVAL <= v_horario_fim LOOP
    -- Verificar se não é horário passado (se for data de hoje)
    IF p_data > CURRENT_DATE OR (p_data = CURRENT_DATE AND v_horario_atual > CURRENT_TIME) THEN
      
      -- Verificar disponibilidade: sem agendamento E sem bloqueio manual
      horario := v_horario_atual;
      disponivel := NOT EXISTS (
        -- Verificar agendamentos existentes
        SELECT 1 
        FROM painel_agendamentos 
        WHERE barbeiro_id = p_barbeiro_id
          AND data = p_data
          AND hora = v_horario_atual
          AND status NOT IN ('cancelado', 'CANCELADO', 'FINALIZADO')
      ) AND NOT EXISTS (
        -- Verificar bloqueios manuais na tabela barber_availability
        SELECT 1
        FROM barber_availability ba
        WHERE ba.barber_id = v_staff_id
          AND ba.date = p_data
          AND ba.is_available = false
          AND v_horario_atual >= ba.start_time
          AND v_horario_atual < ba.end_time
      );
      
      RETURN NEXT;
    END IF;
    
    -- Próximo slot (30 minutos)
    v_horario_atual := v_horario_atual + INTERVAL '30 minutes';
  END LOOP;
  
  RETURN;
END;
$$;
