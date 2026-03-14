ALTER TABLE public.painel_agendamentos 
ADD COLUMN IF NOT EXISTS is_encaixe boolean NOT NULL DEFAULT false;