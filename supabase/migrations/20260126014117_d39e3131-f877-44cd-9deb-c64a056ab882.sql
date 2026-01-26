
-- Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela time_off para gerenciamento de folgas dos barbeiros
CREATE TABLE IF NOT EXISTS public.time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.painel_barbeiros(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'folga',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT time_off_dates_check CHECK (end_date >= start_date)
);

-- Habilitar RLS
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem gerenciar todas as folgas
CREATE POLICY "Admins can manage all time_off"
  ON public.time_off FOR ALL
  USING (is_admin_or_higher(auth.uid()))
  WITH CHECK (is_admin_or_higher(auth.uid()));

-- Política: Barbeiros podem ver suas próprias folgas
CREATE POLICY "Barbers can view own time_off"
  ON public.time_off FOR SELECT
  USING (
    barber_id IN (
      SELECT pb.id FROM painel_barbeiros pb 
      WHERE pb.staff_id = auth.uid()
    )
  );

-- Política: Barbeiros podem criar suas próprias folgas
CREATE POLICY "Barbers can create own time_off"
  ON public.time_off FOR INSERT
  WITH CHECK (
    barber_id IN (
      SELECT pb.id FROM painel_barbeiros pb 
      WHERE pb.staff_id = auth.uid()
    )
  );

-- Política: Barbeiros podem atualizar suas próprias folgas
CREATE POLICY "Barbers can update own time_off"
  ON public.time_off FOR UPDATE
  USING (
    barber_id IN (
      SELECT pb.id FROM painel_barbeiros pb 
      WHERE pb.staff_id = auth.uid()
    )
  );

-- Política: Barbeiros podem deletar suas próprias folgas
CREATE POLICY "Barbers can delete own time_off"
  ON public.time_off FOR DELETE
  USING (
    barber_id IN (
      SELECT pb.id FROM painel_barbeiros pb 
      WHERE pb.staff_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX idx_time_off_barber_id ON public.time_off(barber_id);
CREATE INDEX idx_time_off_dates ON public.time_off(start_date, end_date);
CREATE INDEX idx_time_off_status ON public.time_off(status);

-- Trigger para updated_at
CREATE TRIGGER update_time_off_updated_at
  BEFORE UPDATE ON public.time_off
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
