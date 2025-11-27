-- Dropar o trigger e a função com CASCADE
DROP TRIGGER IF EXISTS prevent_appointment_deletion_trigger ON painel_agendamentos CASCADE;
DROP FUNCTION IF EXISTS prevent_appointment_deletion() CASCADE;

-- Deletar dados relacionados em ordem
-- 1. Deletar avaliações
DELETE FROM appointment_ratings 
WHERE appointment_id IN (SELECT id FROM painel_agendamentos);

-- 2. Deletar serviços extras
DELETE FROM appointment_extra_services 
WHERE appointment_id IN (SELECT id FROM painel_agendamentos);

-- 3. Deletar comissões
DELETE FROM comissoes 
WHERE agendamento_id IN (SELECT id FROM painel_agendamentos);

-- 4. Deletar logs de notificações
DELETE FROM notification_logs 
WHERE appointment_id IN (SELECT id FROM painel_agendamentos);

-- 5. Deletar todos os agendamentos
DELETE FROM painel_agendamentos;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Operação concluída com sucesso!';
  RAISE NOTICE '📋 Todos os agendamentos e dados relacionados foram removidos';
  RAISE NOTICE '🆕 Sistema pronto para começar do zero';
END $$;