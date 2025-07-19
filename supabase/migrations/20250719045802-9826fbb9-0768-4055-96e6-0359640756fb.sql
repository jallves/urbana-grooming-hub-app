
-- Primeiro, vamos alterar a constraint da tabela barber_commissions para aceitar IDs do painel_agendamentos
-- Remover a constraint existente
ALTER TABLE public.barber_commissions 
DROP CONSTRAINT IF EXISTS barber_commissions_appointment_id_fkey;

-- A tabela barber_commissions agora pode aceitar appointment_id de qualquer fonte (painel ou appointments)
-- Vamos adicionar um campo para identificar a origem
ALTER TABLE public.barber_commissions 
ADD COLUMN IF NOT EXISTS appointment_source text DEFAULT 'painel';

-- Comentário para documentar a mudança
COMMENT ON COLUMN public.barber_commissions.appointment_source IS 'Indica se o appointment_id vem de "painel" (painel_agendamentos) ou "appointments"';
