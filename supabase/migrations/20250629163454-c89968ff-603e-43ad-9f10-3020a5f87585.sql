
-- Verificar e criar tabela working_hours se não existir
CREATE TABLE IF NOT EXISTS public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verificar e criar tabela time_off se não existir
CREATE TABLE IF NOT EXISTS public.time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  type TEXT DEFAULT 'personal',
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar constraint de foreign key em appointments para barbers (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appointments_staff_id_fkey' 
    AND table_name = 'appointments'
  ) THEN
    ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES public.barbers(id);
  END IF;
END
$$;

-- Adicionar constraint de foreign key em appointments para services (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appointments_service_id_fkey' 
    AND table_name = 'appointments'
  ) THEN
    ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_service_id_fkey 
    FOREIGN KEY (service_id) REFERENCES public.services(id);
  END IF;
END
$$;

-- Adicionar constraint de foreign key em appointments para clients (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appointments_client_id_fkey' 
    AND table_name = 'appointments'
  ) THEN
    ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES public.clients(id);
  END IF;
END
$$;

-- Habilitar RLS nas tabelas (se não estiver já habilitado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'working_hours' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'time_off' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Criar políticas RLS apenas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'working_hours' 
    AND policyname = 'Public can view working hours'
  ) THEN
    CREATE POLICY "Public can view working hours" ON public.working_hours
      FOR SELECT USING (is_active = true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'working_hours' 
    AND policyname = 'Authenticated users can manage working hours'
  ) THEN
    CREATE POLICY "Authenticated users can manage working hours" ON public.working_hours
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'time_off' 
    AND policyname = 'Public can view time off'
  ) THEN
    CREATE POLICY "Public can view time off" ON public.time_off
      FOR SELECT USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'time_off' 
    AND policyname = 'Authenticated users can manage time off'
  ) THEN
    CREATE POLICY "Authenticated users can manage time off" ON public.time_off
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

-- Inserir horários de trabalho padrão para barbeiros existentes (seg-sab 9h-20h)
INSERT INTO public.working_hours (staff_id, day_of_week, start_time, end_time, is_active)
SELECT 
  b.id,
  generate_series(1, 6) as day_of_week, -- Segunda a sábado
  '09:00:00'::TIME as start_time,
  '20:00:00'::TIME as end_time,
  true as is_active
FROM public.barbers b
WHERE b.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.working_hours wh 
  WHERE wh.staff_id = b.id
)
ON CONFLICT DO NOTHING;

-- Criar função de trigger se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Adicionar triggers se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_working_hours_updated_at'
  ) THEN
    CREATE TRIGGER update_working_hours_updated_at
      BEFORE UPDATE ON public.working_hours
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_time_off_updated_at'
  ) THEN
    CREATE TRIGGER update_time_off_updated_at
      BEFORE UPDATE ON public.time_off
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
