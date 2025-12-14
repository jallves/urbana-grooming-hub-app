-- Adicionar coluna para controlar lembretes enviados
ALTER TABLE public.painel_agendamentos
ADD COLUMN IF NOT EXISTS lembrete_enviado TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Criar índice para busca eficiente
CREATE INDEX IF NOT EXISTS idx_agendamentos_lembrete 
ON public.painel_agendamentos (data, status, lembrete_enviado) 
WHERE lembrete_enviado IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.painel_agendamentos.lembrete_enviado IS 'Timestamp de quando o lembrete de 3 horas foi enviado';