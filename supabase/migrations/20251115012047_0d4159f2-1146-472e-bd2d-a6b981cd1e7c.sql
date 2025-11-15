-- Function to update commission status based on payment status
CREATE OR REPLACE FUNCTION update_commission_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When venda status changes to PAGA, update related commissions to paid
  IF NEW.status = 'PAGA' AND (OLD.status IS NULL OR OLD.status != 'PAGA') THEN
    UPDATE barber_commissions
    SET 
      status = 'paid',
      payment_date = NOW(),
      updated_at = NOW()
    WHERE appointment_id = NEW.agendamento_id
      AND appointment_source = 'painel'
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on vendas table
DROP TRIGGER IF EXISTS trigger_update_commission_on_payment ON vendas;
CREATE TRIGGER trigger_update_commission_on_payment
AFTER UPDATE OF status ON vendas
FOR EACH ROW
EXECUTE FUNCTION update_commission_status_on_payment();

-- Update existing commissions that should be paid
UPDATE barber_commissions bc
SET 
  status = 'paid',
  payment_date = NOW(),
  updated_at = NOW()
FROM vendas v
JOIN painel_agendamentos pa ON v.agendamento_id = pa.id
WHERE bc.appointment_id = pa.id
  AND bc.appointment_source = 'painel'
  AND v.status = 'PAGA'
  AND pa.status = 'concluido'
  AND bc.status = 'pending';

-- Also create a function for direct appointment updates (non-painel)
CREATE OR REPLACE FUNCTION update_commission_on_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When appointment is completed and paid, mark commission as paid
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE barber_commissions
    SET 
      status = 'paid',
      payment_date = NOW(),
      updated_at = NOW()
    WHERE appointment_id = NEW.id
      AND appointment_source = 'appointments'
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on appointments table
DROP TRIGGER IF EXISTS trigger_update_commission_on_appointment ON appointments;
CREATE TRIGGER trigger_update_commission_on_appointment
AFTER UPDATE OF status ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_commission_on_appointment_status();