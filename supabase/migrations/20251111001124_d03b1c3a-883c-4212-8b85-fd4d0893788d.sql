-- Adicionar trigger para prevenir exclusão de agendamentos com integridade comprometida
CREATE OR REPLACE FUNCTION prevent_appointment_deletion()
RETURNS TRIGGER AS $$
DECLARE
  has_check_in BOOLEAN;
  has_sales BOOLEAN;
  is_finalized BOOLEAN;
BEGIN
  -- Verificar check-in
  SELECT EXISTS (
    SELECT 1 FROM totem_sessions 
    WHERE agendamento_id = OLD.id 
    AND check_in_time IS NOT NULL
  ) INTO has_check_in;
  
  -- Verificar vendas
  SELECT EXISTS (
    SELECT 1 FROM vendas 
    WHERE agendamento_id = OLD.id
  ) INTO has_sales;
  
  -- Verificar se está finalizado
  is_finalized := OLD.status IN ('FINALIZADO', 'concluido');
  
  -- Bloquear exclusão se houver violações de integridade
  IF has_check_in THEN
    RAISE EXCEPTION 'Não é possível excluir agendamento com check-in realizado. Considere cancelar o agendamento.';
  END IF;
  
  IF has_sales THEN
    RAISE EXCEPTION 'Não é possível excluir agendamento com vendas associadas. Considere cancelar o agendamento.';
  END IF;
  
  IF is_finalized THEN
    RAISE EXCEPTION 'Não é possível excluir agendamento finalizado. Considere cancelar o agendamento.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS prevent_appointment_deletion_trigger ON painel_agendamentos;
CREATE TRIGGER prevent_appointment_deletion_trigger
  BEFORE DELETE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION prevent_appointment_deletion();