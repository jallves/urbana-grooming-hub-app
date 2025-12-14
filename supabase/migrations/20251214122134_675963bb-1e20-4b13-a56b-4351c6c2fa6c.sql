
-- Forçar checkout de todas as sessões pendentes
-- 1. Atualizar totem_sessions para completed
UPDATE totem_sessions
SET 
  status = 'cancelled',
  check_out_time = NOW()
WHERE check_in_time IS NOT NULL 
  AND check_out_time IS NULL;

-- 2. Atualizar vendas para CANCELADA
UPDATE vendas
SET 
  status = 'CANCELADA',
  updated_at = NOW()
WHERE agendamento_id IN (
  SELECT appointment_id FROM totem_sessions
  WHERE status = 'cancelled'
) AND status = 'ABERTA';

-- 3. Atualizar totem_payments pendentes para cancelled
UPDATE totem_payments
SET 
  status = 'cancelled',
  updated_at = NOW()
WHERE status IN ('pending', 'processing');
