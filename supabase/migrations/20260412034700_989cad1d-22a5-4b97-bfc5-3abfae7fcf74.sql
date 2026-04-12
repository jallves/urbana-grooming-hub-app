
-- Fix orphaned data: appointments cancelled before the trigger existed
UPDATE painel_agendamentos
SET status_totem = NULL
WHERE status = 'cancelado'
  AND status_totem IS NOT NULL
  AND status_totem != 'FINALIZADO';

UPDATE appointment_totem_sessions
SET status = 'cancelled'
WHERE appointment_id IN (
  SELECT id FROM painel_agendamentos WHERE status = 'cancelado'
)
AND status NOT IN ('completed', 'cancelled');
