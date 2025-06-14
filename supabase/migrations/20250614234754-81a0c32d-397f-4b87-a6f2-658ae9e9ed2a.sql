
-- Tabela principal dos barbeiros, vinculando profissionais (staff) ao usuário do sistema (user_id opcional)
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- opcional, vínculo caso o barbeiro tenha login próprio
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id),
  UNIQUE(user_id)
);

-- Histórico/Auditoria de ações de barbeiros (opcional, mas útil para saber modificações no perfil)
CREATE TABLE IF NOT EXISTS public.barber_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

-- Habilitar RLS para garantir segurança dos dados
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_audit_log ENABLE ROW LEVEL SECURITY;

-- Permite que admins acessem todos os dados de barbeiros/barber_audit_log
CREATE POLICY "Admins can manage barbers" ON public.barbers
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage barber audit log" ON public.barber_audit_log
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Permite ao próprio barbeiro visualizar suas informações se user_id estiver vinculado
CREATE POLICY "Barber can view own barber row" ON public.barbers
  FOR SELECT USING (user_id = auth.uid());

-- Permite ao próprio barbeiro ver seu histórico
CREATE POLICY "Barber can view own audit log" ON public.barber_audit_log
  FOR SELECT USING (
    barber_id IN (
      SELECT id FROM public.barbers WHERE user_id = auth.uid()
    )
  );
