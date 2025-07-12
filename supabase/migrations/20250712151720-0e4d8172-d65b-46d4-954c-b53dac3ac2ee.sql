-- Atualizar agendamentos existentes com status 'pendente' para 'confirmado'
UPDATE public.painel_agendamentos 
SET status = 'confirmado' 
WHERE status = 'pendente';

-- Alterar o valor padrão da coluna status para 'confirmado'
ALTER TABLE public.painel_agendamentos 
ALTER COLUMN status SET DEFAULT 'confirmado';

-- Adicionar constraint para garantir apenas status válidos (sem 'pendente')
ALTER TABLE public.painel_agendamentos 
DROP CONSTRAINT IF EXISTS painel_agendamentos_status_check;

ALTER TABLE public.painel_agendamentos 
ADD CONSTRAINT painel_agendamentos_status_check 
CHECK (status IN ('confirmado', 'concluido', 'cancelado'));

-- Comentário para documentar a mudança
COMMENT ON COLUMN public.painel_agendamentos.status IS 'Status do agendamento: confirmado (padrão), concluido, cancelado';