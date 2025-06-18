
-- Criar tabela para horários de funcionamento
CREATE TABLE public.working_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES public.staff(id),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = domingo, 6 = sábado
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para folgas e feriados
CREATE TABLE public.time_off (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES public.staff(id), -- null = feriado geral para toda a barbearia
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  type text NOT NULL DEFAULT 'vacation', -- 'vacation', 'sick', 'holiday', 'personal'
  is_recurring boolean DEFAULT false, -- para feriados anuais
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para configurações gerais de agendamento
CREATE TABLE public.booking_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.booking_settings (setting_key, setting_value, description) VALUES
('business_hours', '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "08:00", "end": "17:00"}, "sunday": {"closed": true}}', 'Horários de funcionamento padrão da barbearia'),
('appointment_interval', '30', 'Intervalo mínimo entre agendamentos em minutos'),
('advance_booking_days', '30', 'Quantos dias no futuro o cliente pode agendar'),
('cancellation_hours', '24', 'Horas mínimas para cancelamento sem penalidade'),
('max_appointments_per_day', '10', 'Máximo de agendamentos por barbeiro por dia');

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para working_hours
CREATE POLICY "Anyone can view working hours" ON public.working_hours
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage their working hours" ON public.working_hours
  FOR ALL USING (staff_id IN (
    SELECT id FROM public.staff WHERE email = auth.jwt() ->> 'email'
  ));

-- Políticas para time_off
CREATE POLICY "Anyone can view time off" ON public.time_off
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage their time off" ON public.time_off
  FOR ALL USING (staff_id IN (
    SELECT id FROM public.staff WHERE email = auth.jwt() ->> 'email'
  ) OR staff_id IS NULL);

-- Políticas para booking_settings
CREATE POLICY "Anyone can view booking settings" ON public.booking_settings
  FOR SELECT USING (true);

-- Criar função para verificar disponibilidade de horário
CREATE OR REPLACE FUNCTION public.check_time_slot_availability(
  p_staff_id uuid,
  p_date date,
  p_start_time time,
  p_duration integer -- em minutos
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_end_time time;
  day_of_week_num integer;
BEGIN
  -- Calcular horário de fim
  p_end_time := p_start_time + (p_duration || ' minutes')::interval;
  
  -- Obter dia da semana (0 = domingo)
  day_of_week_num := EXTRACT(dow FROM p_date);
  
  -- Verificar se o barbeiro trabalha neste dia/horário
  IF NOT EXISTS (
    SELECT 1 FROM public.working_hours 
    WHERE staff_id = p_staff_id 
      AND day_of_week = day_of_week_num
      AND is_active = true
      AND start_time <= p_start_time 
      AND end_time >= p_end_time
  ) THEN
    RETURN false;
  END IF;
  
  -- Verificar se há folga/feriado
  IF EXISTS (
    SELECT 1 FROM public.time_off 
    WHERE (staff_id = p_staff_id OR staff_id IS NULL)
      AND p_date BETWEEN start_date AND end_date
  ) THEN
    RETURN false;
  END IF;
  
  -- Verificar conflitos com outros agendamentos
  IF EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE staff_id = p_staff_id
      AND DATE(start_time) = p_date
      AND status IN ('scheduled', 'confirmed')
      AND (
        (DATE_PART('hour', start_time) * 60 + DATE_PART('minute', start_time)) < 
        (DATE_PART('hour', p_end_time) * 60 + DATE_PART('minute', p_end_time))
        AND
        (DATE_PART('hour', end_time) * 60 + DATE_PART('minute', end_time)) > 
        (DATE_PART('hour', p_start_time) * 60 + DATE_PART('minute', p_start_time))
      )
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Criar função para obter horários disponíveis
CREATE OR REPLACE FUNCTION public.get_available_time_slots(
  p_staff_id uuid,
  p_date date,
  p_service_duration integer -- em minutos
) RETURNS TABLE(time_slot time)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  working_start time;
  working_end time;
  current_slot time;
  slot_interval integer := 30; -- intervalo de 30 minutos
BEGIN
  -- Obter horário de trabalho para o dia
  SELECT start_time, end_time INTO working_start, working_end
  FROM public.working_hours 
  WHERE staff_id = p_staff_id 
    AND day_of_week = EXTRACT(dow FROM p_date)
    AND is_active = true;
  
  -- Se não há horário de trabalho, retornar vazio
  IF working_start IS NULL THEN
    RETURN;
  END IF;
  
  -- Gerar slots de tempo
  current_slot := working_start;
  
  WHILE current_slot + (p_service_duration || ' minutes')::interval <= working_end LOOP
    IF public.check_time_slot_availability(p_staff_id, p_date, current_slot, p_service_duration) THEN
      time_slot := current_slot;
      RETURN NEXT;
    END IF;
    
    current_slot := current_slot + (slot_interval || ' minutes')::interval;
  END LOOP;
END;
$$;

-- Criar trigger para updated_at
CREATE TRIGGER update_working_hours_updated_at
    BEFORE UPDATE ON public.working_hours
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_off_updated_at
    BEFORE UPDATE ON public.time_off
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_settings_updated_at
    BEFORE UPDATE ON public.booking_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
