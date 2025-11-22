-- Ativar realtime para a tabela painel_agendamentos
ALTER TABLE public.painel_agendamentos REPLICA IDENTITY FULL;

-- Comentário explicativo
COMMENT ON TABLE public.painel_agendamentos IS 
'Tabela de agendamentos com realtime habilitado para sincronização automática entre barbeiros e clientes';