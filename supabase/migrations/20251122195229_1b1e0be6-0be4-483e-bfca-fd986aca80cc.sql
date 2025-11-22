-- Políticas RLS para barbeiros gerenciarem seus próprios horários

-- Tabela: working_hours
-- Barbeiros podem visualizar e gerenciar apenas seus próprios horários

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "barbers_view_own_working_hours" ON working_hours;
DROP POLICY IF EXISTS "barbers_manage_own_working_hours" ON working_hours;
DROP POLICY IF EXISTS "admins_manage_all_working_hours" ON working_hours;

-- Barbeiros podem visualizar seus próprios horários
CREATE POLICY "barbers_view_own_working_hours"
ON working_hours
FOR SELECT
USING (
  staff_id IN (
    SELECT s.id 
    FROM staff s
    WHERE s.email = auth.jwt() ->> 'email'
    AND s.role = 'barber'
  )
);

-- Barbeiros podem inserir/atualizar/deletar seus próprios horários
CREATE POLICY "barbers_manage_own_working_hours"
ON working_hours
FOR ALL
USING (
  staff_id IN (
    SELECT s.id 
    FROM staff s
    WHERE s.email = auth.jwt() ->> 'email'
    AND s.role = 'barber'
  )
)
WITH CHECK (
  staff_id IN (
    SELECT s.id 
    FROM staff s
    WHERE s.email = auth.jwt() ->> 'email'
    AND s.role = 'barber'
  )
);

-- Admins podem gerenciar todos os horários
CREATE POLICY "admins_manage_all_working_hours"
ON working_hours
FOR ALL
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Tabela: time_off
-- Barbeiros podem gerenciar suas próprias ausências

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "barbers_view_own_time_off" ON time_off;
DROP POLICY IF EXISTS "barbers_manage_own_time_off" ON time_off;
DROP POLICY IF EXISTS "admins_manage_all_time_off" ON time_off;

-- Barbeiros podem visualizar suas próprias ausências
CREATE POLICY "barbers_view_own_time_off"
ON time_off
FOR SELECT
USING (
  staff_id IN (
    SELECT s.id 
    FROM staff s
    WHERE s.email = auth.jwt() ->> 'email'
    AND s.role = 'barber'
  )
);

-- Barbeiros podem inserir/atualizar/deletar suas próprias ausências
CREATE POLICY "barbers_manage_own_time_off"
ON time_off
FOR ALL
USING (
  staff_id IN (
    SELECT s.id 
    FROM staff s
    WHERE s.email = auth.jwt() ->> 'email'
    AND s.role = 'barber'
  )
)
WITH CHECK (
  staff_id IN (
    SELECT s.id 
    FROM staff s
    WHERE s.email = auth.jwt() ->> 'email'
    AND s.role = 'barber'
  )
);

-- Admins podem gerenciar todas as ausências
CREATE POLICY "admins_manage_all_time_off"
ON time_off
FOR ALL
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_working_hours_staff_day 
ON working_hours(staff_id, day_of_week) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_time_off_staff_dates 
ON time_off(staff_id, start_date, end_date);

-- Atualizar função de verificação de disponibilidade para considerar time_off
CREATE OR REPLACE FUNCTION check_unified_slot_availability(
  p_staff_id UUID,
  p_date DATE,
  p_time TIME,
  p_duration INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  p_end_time TIME;
  p_weekday INTEGER;
  v_has_working_hours BOOLEAN;
  v_has_time_off BOOLEAN;
  v_has_appointment_conflict BOOLEAN;
BEGIN
  -- Calcular horário de término
  p_end_time := p_time + (p_duration || ' minutes')::INTERVAL;
  p_weekday := EXTRACT(DOW FROM p_date);
  
  -- Verificar se o staff trabalha neste dia/horário
  SELECT EXISTS(
    SELECT 1 FROM working_hours
    WHERE staff_id = p_staff_id
    AND day_of_week = p_weekday
    AND is_active = true
    AND p_time >= start_time
    AND p_end_time <= end_time
  ) INTO v_has_working_hours;
  
  IF NOT v_has_working_hours THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se há ausência/folga nesta data
  SELECT EXISTS(
    SELECT 1 FROM time_off
    WHERE staff_id = p_staff_id
    AND p_date BETWEEN start_date AND end_date
  ) INTO v_has_time_off;
  
  IF v_has_time_off THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos com agendamentos existentes
  SELECT EXISTS(
    SELECT 1 FROM appointments
    WHERE staff_id = p_staff_id
    AND DATE(start_time) = p_date
    AND status IN ('scheduled', 'confirmed')
    AND (
      (DATE_PART('hour', start_time) * 60 + DATE_PART('minute', start_time)) < 
      (DATE_PART('hour', p_end_time) * 60 + DATE_PART('minute', p_end_time))
      AND
      (DATE_PART('hour', end_time) * 60 + DATE_PART('minute', end_time)) > 
      (DATE_PART('hour', p_time) * 60 + DATE_PART('minute', p_time))
    )
  ) INTO v_has_appointment_conflict;
  
  IF v_has_appointment_conflict THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar também na tabela painel_agendamentos
  SELECT EXISTS(
    SELECT 1 FROM painel_agendamentos pa
    JOIN painel_barbeiros pb ON pa.barbeiro_id = pb.id
    WHERE pb.staff_id = p_staff_id
    AND pa.data = p_date
    AND pa.status NOT IN ('cancelado', 'ausente')
    AND (
      pa.hora < p_end_time
      AND (pa.hora + (
        SELECT duracao FROM painel_servicos WHERE id = pa.servico_id
      ) * INTERVAL '1 minute') > p_time
    )
  ) INTO v_has_appointment_conflict;
  
  RETURN NOT v_has_appointment_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;