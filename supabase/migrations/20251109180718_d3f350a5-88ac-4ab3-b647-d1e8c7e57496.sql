-- ========================================
-- CORREÇÃO: Trigger de validação de check-in
-- ========================================

-- 1. Limpar sessões inconsistentes (status checkout sem check_out_time)
UPDATE totem_sessions 
SET check_out_time = updated_at
WHERE status IN ('checkout', 'completed') 
  AND check_out_time IS NULL;

-- 2. Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_validar_novo_checkin ON totem_sessions;
DROP FUNCTION IF EXISTS validar_novo_checkin();

-- 3. Criar função corrigida que:
--    - Verifica apenas sessões ATIVAS (check_in, in_service)
--    - Bloqueia apenas se o MESMO agendamento já tem sessão ativa
--    - Não bloqueia múltiplos agendamentos do mesmo cliente no mesmo dia
CREATE OR REPLACE FUNCTION validar_novo_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sessao_ativa_mesmo_agendamento INTEGER;
BEGIN
  -- Verificar se o MESMO agendamento já tem uma sessão ATIVA
  SELECT COUNT(*)
  INTO v_sessao_ativa_mesmo_agendamento
  FROM totem_sessions
  WHERE appointment_id = NEW.appointment_id
    AND status IN ('check_in', 'in_service')
    AND check_out_time IS NULL;
  
  -- Bloquear apenas se o mesmo agendamento já tem check-in ativo
  IF v_sessao_ativa_mesmo_agendamento > 0 THEN
    RAISE EXCEPTION 'Este agendamento já possui um check-in ativo. Aguarde a conclusão do atendimento.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Recriar trigger
CREATE TRIGGER trigger_validar_novo_checkin
  BEFORE INSERT ON totem_sessions
  FOR EACH ROW
  EXECUTE FUNCTION validar_novo_checkin();

-- 5. Adicionar índice para melhorar performance da validação
CREATE INDEX IF NOT EXISTS idx_totem_sessions_appointment_active 
  ON totem_sessions(appointment_id, status) 
  WHERE status IN ('check_in', 'in_service');