-- Criar tabela de barbeiros (se não existir)
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  specialty TEXT,
  commission_type TEXT CHECK (commission_type IN ('percent', 'fixed')) DEFAULT 'percent',
  commission_value NUMERIC DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de horários dos barbeiros
CREATE TABLE IF NOT EXISTS public.barber_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
  weekday INTEGER CHECK (weekday >= 0 AND weekday <= 6), -- 0=domingo, 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajustar tabela de agendamentos para o novo fluxo
DROP TABLE IF EXISTS public.new_appointments;
CREATE TABLE public.new_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de comissões
CREATE TABLE IF NOT EXISTS public.new_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.new_appointments(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Função para calcular comissão automaticamente
CREATE OR REPLACE FUNCTION public.calculate_commission_automatically()
RETURNS TRIGGER AS $$
DECLARE
  barber_commission_type TEXT;
  barber_commission_value NUMERIC;
  service_price NUMERIC;
  commission_amount NUMERIC;
BEGIN
  -- Só processa se o status mudou para 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Buscar dados do barbeiro
    SELECT commission_type, commission_value 
    INTO barber_commission_type, barber_commission_value
    FROM public.barbers 
    WHERE id = NEW.barber_id;
    
    -- Buscar preço do serviço
    SELECT price INTO service_price
    FROM public.services 
    WHERE id = NEW.service_id;
    
    -- Calcular comissão
    IF barber_commission_type = 'percent' THEN
      commission_amount := service_price * (barber_commission_value / 100);
    ELSE
      commission_amount := barber_commission_value;
    END IF;
    
    -- Criar registro de comissão
    INSERT INTO public.new_commissions (appointment_id, barber_id, amount)
    VALUES (NEW.id, NEW.barber_id, commission_amount);
    
    -- Atualizar completed_at
    NEW.completed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar comissão automaticamente
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.new_appointments;
CREATE TRIGGER trigger_calculate_commission
  BEFORE UPDATE ON public.new_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_commission_automatically();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_barbers_updated_at
  BEFORE UPDATE ON public.barbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.new_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO public.barbers (name, email, specialty, commission_type, commission_value) VALUES
('João Silva', 'joao@barbearia.com', 'Corte clássico', 'percent', 50),
('Pedro Santos', 'pedro@barbearia.com', 'Barba e bigode', 'percent', 60),
('Carlos Lima', 'carlos@barbearia.com', 'Corte moderno', 'fixed', 25);

-- Inserir horários de exemplo para os barbeiros
INSERT INTO public.barber_schedules (barber_id, weekday, start_time, end_time) 
SELECT 
  b.id,
  generate_series(1, 5) as weekday, -- segunda a sexta
  '08:00'::TIME,
  '18:00'::TIME
FROM public.barbers b;

-- Inserir sábados com horário reduzido
INSERT INTO public.barber_schedules (barber_id, weekday, start_time, end_time)
SELECT 
  b.id,
  6 as weekday, -- sábado
  '08:00'::TIME,
  '14:00'::TIME
FROM public.barbers b;

-- RLS Policies para as novas tabelas

-- Barbers
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active barbers" ON public.barbers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage barbers" ON public.barbers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- Barber Schedules
ALTER TABLE public.barber_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active schedules" ON public.barber_schedules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage schedules" ON public.barber_schedules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- New Appointments
ALTER TABLE public.new_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own appointments" ON public.new_appointments
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create appointments" ON public.new_appointments
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own pending appointments" ON public.new_appointments
  FOR UPDATE USING (client_id = auth.uid() AND status IN ('pending', 'confirmed'));

CREATE POLICY "Barbers can view assigned appointments" ON public.new_appointments
  FOR SELECT USING (barber_id IN (
    SELECT id FROM public.barbers WHERE email = auth.email()
  ));

CREATE POLICY "Barbers can complete assigned appointments" ON public.new_appointments
  FOR UPDATE USING (barber_id IN (
    SELECT id FROM public.barbers WHERE email = auth.email()
  ));

CREATE POLICY "Admins can manage all appointments" ON public.new_appointments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- New Commissions
ALTER TABLE public.new_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbers can view own commissions" ON public.new_commissions
  FOR SELECT USING (barber_id IN (
    SELECT id FROM public.barbers WHERE email = auth.email()
  ));

CREATE POLICY "Admins can manage all commissions" ON public.new_commissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- Função para verificar disponibilidade de horário
CREATE OR REPLACE FUNCTION public.check_barber_availability(
  p_barber_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_end_time TIME;
  v_weekday INTEGER;
  v_has_schedule BOOLEAN;
  v_has_conflict BOOLEAN;
BEGIN
  -- Calcular horário de término
  v_end_time := p_time + (p_duration_minutes * INTERVAL '1 minute');
  v_weekday := EXTRACT(DOW FROM p_date);
  
  -- Verificar se o barbeiro trabalha neste dia/horário
  SELECT EXISTS(
    SELECT 1 FROM public.barber_schedules
    WHERE barber_id = p_barber_id
    AND weekday = v_weekday
    AND is_active = true
    AND p_time >= start_time
    AND v_end_time <= end_time
  ) INTO v_has_schedule;
  
  IF NOT v_has_schedule THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos com agendamentos existentes
  SELECT EXISTS(
    SELECT 1 FROM public.new_appointments
    WHERE barber_id = p_barber_id
    AND scheduled_date = p_date
    AND status NOT IN ('canceled')
    AND (
      (scheduled_time <= p_time AND (scheduled_time + INTERVAL '60 minutes') > p_time)
      OR (scheduled_time < v_end_time AND scheduled_time >= p_time)
    )
  ) INTO v_has_conflict;
  
  RETURN NOT v_has_conflict;
END;
$$ LANGUAGE plpgsql;