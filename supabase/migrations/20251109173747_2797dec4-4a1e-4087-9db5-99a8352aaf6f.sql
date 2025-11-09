
-- ========================================
-- REGRA 1: Função para obter horários disponíveis do barbeiro
-- ========================================

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
BEGIN
  -- Obter dia da semana (0 = domingo, 6 = sábado)
  v_dia_semana := EXTRACT(DOW FROM p_data);
  v_now := NOW();
  
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
      
      -- Verificar se há conflito com agendamentos existentes
      horario := v_horario_atual;
      disponivel := NOT EXISTS (
        SELECT 1 
        FROM painel_agendamentos 
        WHERE barbeiro_id = p_barbeiro_id
          AND data = p_data
          AND hora = v_horario_atual
          AND status NOT IN ('cancelado', 'CANCELADO', 'FINALIZADO')
      );
      
      RETURN NEXT;
    END IF;
    
    -- Próximo slot (30 minutos)
    v_horario_atual := v_horario_atual + INTERVAL '30 minutes';
  END LOOP;
  
  RETURN;
END;
$$;

-- ========================================
-- REGRA 2: Trigger para garantir checkout após check-in
-- ========================================

-- Função para validar finalização de checkout
CREATE OR REPLACE FUNCTION validar_novo_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checkin_aberto INTEGER;
BEGIN
  -- Verificar se há check-in sem checkout para este cliente
  SELECT COUNT(*)
  INTO v_checkin_aberto
  FROM totem_sessions ts
  JOIN painel_agendamentos pa ON ts.appointment_id = pa.id
  WHERE pa.cliente_id = (
    SELECT cliente_id 
    FROM painel_agendamentos 
    WHERE id = NEW.appointment_id
  )
  AND ts.status IN ('check_in', 'checkout')
  AND ts.check_out_time IS NULL;
  
  IF v_checkin_aberto > 0 THEN
    RAISE EXCEPTION 'Cliente possui check-in sem finalização. Finalize o checkout antes de fazer novo check-in.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para validar check-in
DROP TRIGGER IF EXISTS trigger_validar_novo_checkin ON totem_sessions;
CREATE TRIGGER trigger_validar_novo_checkin
  BEFORE INSERT ON totem_sessions
  FOR EACH ROW
  EXECUTE FUNCTION validar_novo_checkin();

-- ========================================
-- REGRA 3: Tabela para vendas diretas de produtos (sem agendamento)
-- ========================================

-- Já existe a tabela vendas, mas vamos garantir que agendamento_id seja nullable
-- para permitir vendas diretas de produtos

-- Comentário explicativo
COMMENT ON COLUMN vendas.agendamento_id IS 'ID do agendamento (nullable para vendas diretas de produtos)';
COMMENT ON COLUMN vendas.cliente_id IS 'ID do cliente (obrigatório para todas as vendas)';

-- ========================================
-- REGRA 4: Índices para melhor performance
-- ========================================

-- Índice para buscar horários disponíveis rapidamente
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data_hora 
ON painel_agendamentos(barbeiro_id, data, hora, status);

-- Índice para verificar check-ins abertos
CREATE INDEX IF NOT EXISTS idx_totem_sessions_status_checkout 
ON totem_sessions(status, check_out_time) 
WHERE check_out_time IS NULL;

-- ========================================
-- View para dashboard de vendas abertas (administrativo)
-- ========================================

CREATE OR REPLACE VIEW vw_vendas_abertas AS
SELECT 
  v.id as venda_id,
  v.cliente_id,
  pc.nome as cliente_nome,
  pc.whatsapp as cliente_whatsapp,
  v.agendamento_id,
  v.totem_session_id,
  v.total,
  v.updated_at,
  ts.status as sessao_status,
  ts.check_in_time,
  CASE 
    WHEN v.agendamento_id IS NULL THEN 'PRODUTO_DIRETO'
    ELSE 'SERVICO'
  END as tipo_venda,
  EXTRACT(EPOCH FROM (NOW() - v.updated_at))/3600 as horas_aberta
FROM vendas v
LEFT JOIN painel_clientes pc ON v.cliente_id = pc.id
LEFT JOIN totem_sessions ts ON v.totem_session_id = ts.id
WHERE v.status = 'ABERTA'
ORDER BY v.updated_at DESC;

COMMENT ON VIEW vw_vendas_abertas IS 'View administrativa para monitorar vendas não finalizadas';
