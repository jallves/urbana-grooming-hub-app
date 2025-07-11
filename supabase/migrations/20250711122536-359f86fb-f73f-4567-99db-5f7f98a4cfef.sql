-- Corrigir constraint de status da tabela painel_agendamentos para incluir 'concluido'
ALTER TABLE public.painel_agendamentos 
DROP CONSTRAINT IF EXISTS painel_agendamentos_status_check;

ALTER TABLE public.painel_agendamentos 
ADD CONSTRAINT painel_agendamentos_status_check 
CHECK (status = ANY (ARRAY['pendente'::text, 'confirmado'::text, 'cancelado'::text, 'concluido'::text]));