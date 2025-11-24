-- Garantir REPLICA IDENTITY FULL para capturar todos os dados nas atualizações em tempo real
ALTER TABLE painel_agendamentos REPLICA IDENTITY FULL;