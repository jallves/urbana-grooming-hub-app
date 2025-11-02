-- Criar tabela de avaliações de atendimento
CREATE TABLE IF NOT EXISTS public.appointment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.painel_agendamentos(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.painel_clientes(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.painel_barbeiros(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.appointment_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem inserir avaliações"
  ON public.appointment_ratings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem visualizar avaliações"
  ON public.appointment_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Apenas o cliente pode atualizar sua avaliação"
  ON public.appointment_ratings
  FOR UPDATE
  USING (client_id = client_id);

-- Índices para performance
CREATE INDEX idx_appointment_ratings_appointment ON public.appointment_ratings(appointment_id);
CREATE INDEX idx_appointment_ratings_barber ON public.appointment_ratings(barber_id);
CREATE INDEX idx_appointment_ratings_client ON public.appointment_ratings(client_id);
CREATE INDEX idx_appointment_ratings_created ON public.appointment_ratings(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_appointment_ratings_updated_at
  BEFORE UPDATE ON public.appointment_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();