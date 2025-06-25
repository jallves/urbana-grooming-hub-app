
-- Criar função para buscar barbeiros disponíveis
CREATE OR REPLACE FUNCTION get_available_barbers(
  p_service_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  image_url TEXT,
  specialties TEXT,
  experience TEXT,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_datetime TIMESTAMP;
  p_end_datetime TIMESTAMP;
  p_weekday INTEGER;
BEGIN
  -- Converter data e hora para timestamp
  p_datetime := p_date + p_time;
  p_end_datetime := p_datetime + (p_duration * INTERVAL '1 minute');
  p_weekday := EXTRACT(DOW FROM p_date);
  
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.email,
    b.phone,
    b.image_url,
    b.specialties,
    b.experience,
    b.role,
    b.is_active
  FROM barbers b
  WHERE b.is_active = TRUE
  -- Verificar se o barbeiro trabalha neste dia/horário
  AND EXISTS (
    SELECT 1 FROM working_hours wh
    WHERE wh.staff_id = b.id
    AND wh.day_of_week = p_weekday
    AND wh.is_active = TRUE
    AND p_time >= wh.start_time
    AND (p_time + (p_duration * INTERVAL '1 minute'))::TIME <= wh.end_time
  )
  -- Verificar se não há conflitos com agendamentos existentes
  AND NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.staff_id = b.id
    AND DATE(a.start_time) = p_date
    AND (
      (a.start_time < p_end_datetime AND a.end_time > p_datetime)
    )
    AND a.status IN ('scheduled', 'confirmed')
  )
  -- Verificar disponibilidade específica (se existir)
  AND (
    NOT EXISTS (
      SELECT 1 FROM barber_availability ba
      WHERE ba.barber_id = b.id
      AND ba.date = p_date
    )
    OR EXISTS (
      SELECT 1 FROM barber_availability ba
      WHERE ba.barber_id = b.id
      AND ba.date = p_date
      AND ba.is_available = TRUE
      AND p_time >= ba.start_time
      AND (p_time + (p_duration * INTERVAL '1 minute'))::TIME <= ba.end_time
    )
  );
END;
$$;

-- Criar função para validar agendamento antes de confirmar
CREATE OR REPLACE FUNCTION validate_appointment_booking(
  p_client_id UUID,
  p_staff_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_conflict_count INTEGER;
  v_working_hours RECORD;
  v_day_of_week INTEGER;
  v_start_time TIME;
  v_end_time TIME;
BEGIN
  -- Verificar se há conflitos de agendamento
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE staff_id = p_staff_id
  AND (
    (start_time < p_end_time AND end_time > p_start_time)
  )
  AND status IN ('scheduled', 'confirmed')
  AND id != COALESCE(NULL, gen_random_uuid()); -- Para updates futuros
  
  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Barbeiro já possui agendamento neste horário'
    );
  END IF;
  
  -- Verificar horário de trabalho
  v_day_of_week := EXTRACT(DOW FROM p_start_time::DATE);
  v_start_time := p_start_time::TIME;
  v_end_time := p_end_time::TIME;
  
  SELECT * INTO v_working_hours
  FROM working_hours
  WHERE staff_id = p_staff_id
  AND day_of_week = v_day_of_week
  AND is_active = TRUE;
  
  IF v_working_hours IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Barbeiro não trabalha neste dia'
    );
  END IF;
  
  IF v_start_time < v_working_hours.start_time OR v_end_time > v_working_hours.end_time THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Horário fora do expediente do barbeiro'
    );
  END IF;
  
  -- Verificar disponibilidade específica
  IF EXISTS (
    SELECT 1 FROM barber_availability
    WHERE barber_id = p_staff_id
    AND date = p_start_time::DATE
    AND (
      is_available = FALSE
      OR v_start_time < start_time
      OR v_end_time > end_time
    )
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Barbeiro não está disponível neste horário'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Agendamento válido'
  );
END;
$$;

-- Garantir que as tabelas tenham RLS adequado
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir leitura pública de dados necessários
CREATE POLICY "Public can view active barbers" ON barbers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view working hours" ON working_hours
  FOR SELECT USING (is_active = true);
