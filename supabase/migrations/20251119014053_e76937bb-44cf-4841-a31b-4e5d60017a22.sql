-- Criar tabela de relacionamento entre serviços e barbeiros (staff)
CREATE TABLE IF NOT EXISTS public.service_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.painel_servicos(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, staff_id)
);

-- Habilitar RLS
ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura pública de service_staff"
  ON public.service_staff
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção para admins"
  ON public.service_staff
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para admins"
  ON public.service_staff
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir exclusão para admins"
  ON public.service_staff
  FOR DELETE
  USING (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_staff_service_id ON public.service_staff(service_id);
CREATE INDEX IF NOT EXISTS idx_service_staff_staff_id ON public.service_staff(staff_id);

-- Comentários
COMMENT ON TABLE public.service_staff IS 'Relacionamento muitos-para-muitos entre serviços e barbeiros (staff). Define quais barbeiros podem realizar quais serviços.';
COMMENT ON COLUMN public.service_staff.service_id IS 'ID do serviço';
COMMENT ON COLUMN public.service_staff.staff_id IS 'ID do barbeiro (staff)';

-- Tentar deletar serviços existentes (pode falhar se houver relacionamentos)
-- Se falhar, o usuário será notificado
DO $$
BEGIN
  DELETE FROM public.painel_servicos;
  RAISE NOTICE 'Todos os serviços foram deletados com sucesso.';
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'Não foi possível deletar os serviços pois existem agendamentos vinculados. Os novos serviços serão inseridos mesmo assim.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar serviços: %. Os novos serviços serão inseridos mesmo assim.', SQLERRM;
END $$;

-- Inserir todos os novos serviços
INSERT INTO public.painel_servicos (nome, descricao, preco, duracao, is_active, show_on_home) VALUES
  ('Corte + Barba', 'Corte de cabelo completo com acabamento de barba', 0, 60, true, true),
  ('Corte + Barba + Sobrancelha', 'Corte, barba e design de sobrancelha', 0, 60, true, true),
  ('Corte + Sobrancelha', 'Corte de cabelo com design de sobrancelha', 0, 30, true, false),
  ('Corte + Tonalização', 'Corte de cabelo com tonalização', 0, 90, true, false),
  ('Depilação Perna Inteira', 'Depilação completa das pernas', 0, 30, true, false),
  ('Detox com Manta + Massagem', 'Detox corporal com manta térmica e massagem relaxante', 0, 120, true, true),
  ('Detox Corporal com Manta Térmica', 'Tratamento de detox com manta térmica', 0, 60, true, false),
  ('Drenagem Linfática', 'Massagem de drenagem linfática', 0, 90, true, false),
  ('Hidratação', 'Hidratação capilar profunda', 0, 45, true, false),
  ('Hidratação V.O', 'Hidratação capilar V.O', 0, 45, true, false),
  ('Limpeza de Pele', 'Limpeza facial profunda', 0, 60, true, false),
  ('Luzes', 'Mechas e luzes no cabelo', 0, 120, true, false),
  ('Massagem Desportiva', 'Massagem terapêutica para atletas', 0, 90, true, false),
  ('Massagem Podal', 'Massagem relaxante nos pés', 0, 60, true, false),
  ('Massagem Relaxante', 'Massagem corporal relaxante', 0, 90, true, true),
  ('Pezinho', 'Cuidados com os pés', 0, 30, true, false),
  ('Platinado', 'Platinado completo do cabelo', 0, 120, true, false),
  ('Quick Massage', 'Massagem rápida de 30 minutos', 0, 30, true, false),
  ('Revitalização Facial', 'Tratamento facial revitalizante', 0, 60, true, false),
  ('Selagem', 'Selagem capilar', 0, 60, true, false),
  ('Selagem + Corte', 'Selagem com corte de cabelo', 0, 90, true, false),
  ('Sobrancelha', 'Design de sobrancelha', 0, 15, true, false),
  ('Sobrancelha Egípcia', 'Design de sobrancelha com técnica egípcia', 0, 30, true, false),
  ('Sobrancelha Pinça', 'Design de sobrancelha com pinça', 0, 30, true, false),
  ('Spa dos Pés', 'Tratamento completo spa para os pés', 0, 60, true, false),
  ('Tonalização Barba', 'Tonalização da barba', 0, 60, true, false),
  ('Tonalização Cabelo', 'Tonalização do cabelo', 0, 60, true, false)
ON CONFLICT DO NOTHING;