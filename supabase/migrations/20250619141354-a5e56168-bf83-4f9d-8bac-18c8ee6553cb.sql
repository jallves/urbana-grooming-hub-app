
-- Corrigir a tabela working_hours
ALTER TABLE working_hours 
ALTER COLUMN staff_id SET NOT NULL;

-- Adicionar constraints de validação
ALTER TABLE working_hours 
ADD CONSTRAINT valid_time_range CHECK (start_time < end_time),
ADD CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6);

-- Criar tabela barber_availability para disponibilidade específica
CREATE TABLE IF NOT EXISTS barber_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_slot CHECK (start_time < end_time),
  UNIQUE(barber_id, date, start_time, end_time)
);

-- Função corrigida para verificar disponibilidade de barbeiro
CREATE OR REPLACE FUNCTION check_barber_availability(
  p_barber_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_end_time TIME;
  v_day_of_week INTEGER;
  v_is_available BOOLEAN;
  v_has_conflict BOOLEAN;
BEGIN
  -- Calcular horário final
  v_end_time := (p_start_time + (p_duration_minutes * interval '1 minute'))::TIME;
  
  -- Verificar se é dia de folga
  PERFORM 1 FROM time_off 
  WHERE staff_id = p_barber_id 
    AND p_date BETWEEN start_date AND end_date;
  
  IF FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar horário de trabalho padrão
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  SELECT EXISTS (
    SELECT 1 FROM working_hours
    WHERE staff_id = p_barber_id
      AND day_of_week = v_day_of_week
      AND is_active = TRUE
      AND p_start_time >= start_time
      AND v_end_time <= end_time
  ) INTO v_is_available;
  
  IF NOT v_is_available THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar disponibilidade específica (se existir entrada para o dia)
  SELECT EXISTS (
    SELECT 1 FROM barber_availability
    WHERE barber_id = p_barber_id
      AND date = p_date
  ) INTO v_has_conflict;
  
  IF v_has_conflict THEN
    SELECT EXISTS (
      SELECT 1 FROM barber_availability
      WHERE barber_id = p_barber_id
        AND date = p_date
        AND is_available = TRUE
        AND p_start_time >= start_time
        AND v_end_time <= end_time
    ) INTO v_is_available;
    
    IF NOT v_is_available THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Verificar conflitos com agendamentos existentes
  SELECT EXISTS (
    SELECT 1 FROM appointments
    WHERE staff_id = p_barber_id
      AND DATE(start_time) = p_date
      AND (
        (DATE_PART('hour', start_time) * 60 + DATE_PART('minute', start_time)) < 
        (DATE_PART('hour', v_end_time) * 60 + DATE_PART('minute', v_end_time))
        AND
        (DATE_PART('hour', end_time) * 60 + DATE_PART('minute', end_time)) > 
        (DATE_PART('hour', p_start_time) * 60 + DATE_PART('minute', p_start_time))
      )
      AND status NOT IN ('cancelled', 'no-show')
  ) INTO v_has_conflict;
  
  RETURN NOT v_has_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter slots de tempo disponíveis (atualizada)
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_staff_id UUID, 
  p_date DATE, 
  p_service_duration INTEGER
) RETURNS TABLE(time_slot TIME) AS $$
DECLARE
  working_start TIME;
  working_end TIME;
  current_slot TIME;
  slot_interval INTEGER := 30; -- intervalo de 30 minutos
BEGIN
  -- Obter horário de trabalho para o dia
  SELECT start_time, end_time INTO working_start, working_end
  FROM working_hours 
  WHERE staff_id = p_staff_id 
    AND day_of_week = EXTRACT(DOW FROM p_date)
    AND is_active = TRUE;
  
  -- Se não há horário de trabalho, retornar vazio
  IF working_start IS NULL THEN
    RETURN;
  END IF;
  
  -- Gerar slots de tempo
  current_slot := working_start;
  
  WHILE current_slot + (p_service_duration || ' minutes')::INTERVAL <= working_end LOOP
    IF check_barber_availability(p_staff_id, p_date, current_slot, p_service_duration) THEN
      time_slot := current_slot;
      RETURN NEXT;
    END IF;
    
    current_slot := current_slot + (slot_interval || ' minutes')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_barber_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_barber_availability_updated_at_trigger
    BEFORE UPDATE ON barber_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_barber_availability_updated_at();
