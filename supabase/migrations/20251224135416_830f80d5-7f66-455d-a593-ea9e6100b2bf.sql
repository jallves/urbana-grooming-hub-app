
-- Atualizar status do pagamento para completed
UPDATE totem_payments 
SET status = 'completed', paid_at = NOW()
WHERE id = 'c35a4ab7-c6d6-4552-9d4b-5da6ee4ae1fc'
AND status = 'processing';
