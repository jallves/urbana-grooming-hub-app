-- Desabilitar temporariamente os triggers de validação
ALTER TABLE painel_agendamentos DISABLE TRIGGER trigger_check_appointment_conflict;
ALTER TABLE painel_agendamentos DISABLE TRIGGER trigger_validate_appointment_date;
ALTER TABLE painel_agendamentos DISABLE TRIGGER trigger_validate_business_hours;
ALTER TABLE painel_agendamentos DISABLE TRIGGER validate_appointment_time_trigger;

-- Executar atualização dos agendamentos
UPDATE painel_agendamentos pa
SET 
  status = 'concluido',
  status_totem = 'FINALIZADO',
  updated_at = NOW()
FROM totem_sessions ts
WHERE ts.appointment_id = pa.id
  AND ts.status = 'completed'
  AND ts.check_out_time IS NOT NULL
  AND pa.status != 'concluido';

-- Reabilitar triggers
ALTER TABLE painel_agendamentos ENABLE TRIGGER trigger_check_appointment_conflict;
ALTER TABLE painel_agendamentos ENABLE TRIGGER trigger_validate_appointment_date;
ALTER TABLE painel_agendamentos ENABLE TRIGGER trigger_validate_business_hours;
ALTER TABLE painel_agendamentos ENABLE TRIGGER validate_appointment_time_trigger;

-- Verificar quantos foram atualizados
SELECT COUNT(*) as agendamentos_atualizados
FROM painel_agendamentos pa
JOIN totem_sessions ts ON ts.appointment_id = pa.id
WHERE pa.status = 'concluido'
  AND ts.status = 'completed';