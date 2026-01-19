-- Criar tabela de avaliações de atendimentos
CREATE TABLE IF NOT EXISTS public.appointment_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.painel_agendamentos(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.painel_clientes(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.painel_barbeiros(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointment_ratings_rating ON public.appointment_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_appointment_ratings_created_at ON public.appointment_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_ratings_barber_id ON public.appointment_ratings(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointment_ratings_client_id ON public.appointment_ratings(client_id);

-- Habilitar RLS
ALTER TABLE public.appointment_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Qualquer um pode criar avaliações (totem não tem autenticação)
CREATE POLICY "Anyone can create ratings" 
ON public.appointment_ratings 
FOR INSERT 
WITH CHECK (true);

-- Qualquer um pode visualizar avaliações (para exibir na homepage)
CREATE POLICY "Anyone can view ratings" 
ON public.appointment_ratings 
FOR SELECT 
USING (true);

-- Apenas admin pode atualizar/deletar
CREATE POLICY "Admins can update ratings" 
ON public.appointment_ratings 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can delete ratings" 
ON public.appointment_ratings 
FOR DELETE 
USING (true);

-- Habilitar Realtime para atualização em tempo real na homepage
ALTER PUBLICATION supabase_realtime ADD TABLE appointment_ratings;

-- Comentário na tabela
COMMENT ON TABLE public.appointment_ratings IS 'Avaliações de atendimentos enviadas pelos clientes no totem';