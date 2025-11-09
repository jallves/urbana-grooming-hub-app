
-- Remover trigger restritivo que bloqueia check-ins desnecessariamente
DROP TRIGGER IF EXISTS trigger_validar_novo_checkin ON totem_sessions;
DROP FUNCTION IF EXISTS validar_novo_checkin();

-- Criar função mais inteligente que só bloqueia check-ins do mesmo dia
CREATE OR REPLACE FUNCTION validar_novo_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agendamento_data DATE;
  v_checkin_aberto_hoje INTEGER;
BEGIN
  -- Buscar data do agendamento
  SELECT data INTO v_agendamento_data
  FROM painel_agendamentos
  WHERE id = NEW.appointment_id;
  
  -- Se não encontrou em painel_agendamentos, buscar em appointments
  IF v_agendamento_data IS NULL THEN
    SELECT DATE(start_time) INTO v_agendamento_data
    FROM appointments
    WHERE id = NEW.appointment_id;
  END IF;
  
  -- Se ainda não encontrou, permitir (será tratado pela edge function)
  IF v_agendamento_data IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se há check-in ABERTO (sem checkout) NO MESMO DIA para este cliente
  SELECT COUNT(*)
  INTO v_checkin_aberto_hoje
  FROM totem_sessions ts
  LEFT JOIN painel_agendamentos pa ON ts.appointment_id = pa.id
  LEFT JOIN appointments apt ON ts.appointment_id = apt.id
  WHERE (
    pa.cliente_id = (SELECT cliente_id FROM painel_agendamentos WHERE id = NEW.appointment_id)
    OR apt.client_id = (SELECT client_id FROM appointments WHERE id = NEW.appointment_id)
  )
  AND ts.status IN ('check_in', 'checkout')
  AND ts.check_out_time IS NULL
  AND (
    pa.data = v_agendamento_data
    OR DATE(apt.start_time) = v_agendamento_data
  );
  
  -- Só bloquear se houver check-in aberto NO MESMO DIA
  IF v_checkin_aberto_hoje > 0 THEN
    RAISE EXCEPTION 'Você já possui um check-in em aberto hoje. Finalize o checkout antes de fazer novo check-in.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER trigger_validar_novo_checkin
  BEFORE INSERT ON totem_sessions
  FOR EACH ROW
  EXECUTE FUNCTION validar_novo_checkin();
