-- Desabilitar temporariamente os triggers de validação
ALTER TABLE painel_agendamentos DISABLE TRIGGER trigger_check_appointment_conflict;
ALTER TABLE painel_agendamentos DISABLE TRIGGER trigger_validate_appointment_date;
ALTER TABLE painel_agendamentos DISABLE TRIGGER trigger_validate_business_hours;
ALTER TABLE painel_agendamentos DISABLE TRIGGER validate_appointment_time_trigger;

-- Atualizar agendamentos com check-in para status confirmado
UPDATE painel_agendamentos pa
SET 
  status = 'confirmado',
  updated_at = NOW()
FROM totem_sessions ts
WHERE ts.appointment_id = pa.id
  AND ts.check_in_time IS NOT NULL
  AND pa.status NOT IN ('confirmado', 'concluido');

-- Reabilitar triggers
ALTER TABLE painel_agendamentos ENABLE TRIGGER trigger_check_appointment_conflict;
ALTER TABLE painel_agendamentos ENABLE TRIGGER trigger_validate_appointment_date;
ALTER TABLE painel_agendamentos ENABLE TRIGGER trigger_validate_business_hours;
ALTER TABLE painel_agendamentos ENABLE TRIGGER validate_appointment_time_trigger;