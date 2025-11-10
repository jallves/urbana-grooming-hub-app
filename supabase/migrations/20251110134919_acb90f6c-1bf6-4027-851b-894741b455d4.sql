-- ================================================================
-- SISTEMA ROBUSTO DE VALIDAÇÃO DE AGENDAMENTOS
-- ================================================================

-- 1. CRIAR ÍNDICES PARA PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_barbeiro_data_hora 
ON painel_agendamentos(barbeiro_id, data, hora) 
WHERE status != 'cancelado';

CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_data_status 
ON painel_agendamentos(data, status);

CREATE INDEX IF NOT EXISTS idx_appointments_staff_time 
ON appointments(staff_id, start_time, end_time) 
WHERE status IN ('scheduled', 'confirmed');

-- 2. FUNÇÃO PARA VALIDAR HORÁRIO NÃO PASSADO (DIA ATUAL)
-- ================================================================
CREATE OR REPLACE FUNCTION validate_appointment_time()
RETURNS TRIGGER AS $$
DECLARE
  appointment_datetime TIMESTAMP;
  min_advance_time TIMESTAMP;
BEGIN
  -- Construir timestamp completo do agendamento
  appointment_datetime := NEW.data + NEW.hora::TIME;
  
  -- Horário mínimo: agora + 30 minutos
  min_advance_time := NOW() + INTERVAL '30 minutes';
  
  -- Validar apenas para novos agendamentos ou alterações de data/hora
  IF (TG_OP = 'INSERT' OR OLD.data != NEW.data OR OLD.hora != NEW.hora) THEN
    -- Verificar se o horário já passou
    IF appointment_datetime < min_advance_time THEN
      RAISE EXCEPTION 'Horário inválido: agendamentos devem ser feitos com pelo menos 30 minutos de antecedência. Horário solicitado: %, Horário mínimo: %', 
        appointment_datetime, min_advance_time;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO PARA VALIDAR CONFLITOS DE HORÁRIO
-- ================================================================
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
  service_duration INTEGER;
  appointment_start TIME;
  appointment_end TIME;
  conflict_record RECORD;
BEGIN
  -- Buscar duração do serviço
  SELECT duracao INTO service_duration
  FROM painel_servicos
  WHERE id = NEW.servico_id;
  
  -- Se não encontrou o serviço, usar duração padrão de 60 minutos
  IF service_duration IS NULL THEN
    service_duration := 60;
  END IF;
  
  -- Calcular horário de início e fim
  appointment_start := NEW.hora::TIME;
  appointment_end := (appointment_start + (service_duration || ' minutes')::INTERVAL)::TIME;
  
  -- Verificar conflitos com outros agendamentos
  -- Um conflito existe quando:
  -- 1. É do mesmo barbeiro
  -- 2. É na mesma data
  -- 3. Não está cancelado
  -- 4. Não é o próprio agendamento (em caso de UPDATE)
  -- 5. Há sobreposição de horários
  
  FOR conflict_record IN
    SELECT 
      a.id,
      a.hora,
      s.duracao,
      (a.hora::TIME + (COALESCE(s.duracao, 60) || ' minutes')::INTERVAL)::TIME as fim
    FROM painel_agendamentos a
    JOIN painel_servicos s ON a.servico_id = s.id
    WHERE a.barbeiro_id = NEW.barbeiro_id
      AND a.data = NEW.data
      AND a.status != 'cancelado'
      AND (TG_OP = 'INSERT' OR a.id != NEW.id)
  LOOP
    -- Verificar sobreposição de horários
    -- Sobreposição acontece quando:
    -- (novo_inicio < existente_fim) E (novo_fim > existente_inicio)
    IF (appointment_start < conflict_record.fim) AND 
       (appointment_end > conflict_record.hora::TIME) THEN
      RAISE EXCEPTION 'Conflito de horário detectado: já existe um agendamento às % para este barbeiro nesta data. Novo agendamento solicitado: % - %, Agendamento existente: % - %',
        conflict_record.hora,
        appointment_start,
        appointment_end,
        conflict_record.hora,
        conflict_record.fim;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO PARA VALIDAR HORÁRIO DE FUNCIONAMENTO
-- ================================================================
CREATE OR REPLACE FUNCTION validate_business_hours()
RETURNS TRIGGER AS $$
DECLARE
  hour_value INTEGER;
  minute_value INTEGER;
BEGIN
  -- Extrair hora e minuto
  hour_value := EXTRACT(HOUR FROM NEW.hora::TIME);
  minute_value := EXTRACT(MINUTE FROM NEW.hora::TIME);
  
  -- Validar horário de funcionamento (8h às 20h)
  IF hour_value < 8 OR hour_value >= 20 THEN
    RAISE EXCEPTION 'Horário fora do expediente: nosso funcionamento é das 08:00 às 20:00. Horário solicitado: %', NEW.hora;
  END IF;
  
  -- Validar intervalos de 30 minutos
  IF minute_value NOT IN (0, 30) THEN
    RAISE EXCEPTION 'Horário inválido: agendamentos devem ser feitos em intervalos de 30 minutos (XX:00 ou XX:30). Horário solicitado: %', NEW.hora;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO PARA VALIDAR DATA
-- ================================================================
CREATE OR REPLACE FUNCTION validate_appointment_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que a data não é no passado
  IF NEW.data < CURRENT_DATE THEN
    RAISE EXCEPTION 'Data inválida: não é possível agendar para datas passadas. Data solicitada: %, Data atual: %', 
      NEW.data, CURRENT_DATE;
  END IF;
  
  -- Validar que a data não é muito no futuro (máximo 60 dias)
  IF NEW.data > CURRENT_DATE + INTERVAL '60 days' THEN
    RAISE EXCEPTION 'Data inválida: agendamentos podem ser feitos com até 60 dias de antecedência. Data solicitada: %', NEW.data;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CRIAR TRIGGERS NA ORDEM CORRETA
-- ================================================================

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS trigger_validate_appointment_date ON painel_agendamentos;
DROP TRIGGER IF EXISTS trigger_validate_business_hours ON painel_agendamentos;
DROP TRIGGER IF EXISTS trigger_validate_appointment_time ON painel_agendamentos;
DROP TRIGGER IF EXISTS trigger_check_appointment_conflict ON painel_agendamentos;

-- Ordem dos triggers (executam nesta sequência):
-- 1. Validar data
CREATE TRIGGER trigger_validate_appointment_date
  BEFORE INSERT OR UPDATE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_date();

-- 2. Validar horário de funcionamento
CREATE TRIGGER trigger_validate_business_hours
  BEFORE INSERT OR UPDATE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION validate_business_hours();

-- 3. Validar que não é horário passado (para dia atual)
CREATE TRIGGER trigger_validate_appointment_time
  BEFORE INSERT OR UPDATE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_time();

-- 4. Verificar conflitos (último, depois de todas as validações básicas)
CREATE TRIGGER trigger_check_appointment_conflict
  BEFORE INSERT OR UPDATE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_conflict();

-- 7. FUNÇÃO AUXILIAR PARA BUSCAR HORÁRIOS DISPONÍVEIS
-- ================================================================
CREATE OR REPLACE FUNCTION get_available_slots(
  p_barbeiro_id UUID,
  p_data DATE,
  p_duracao INTEGER DEFAULT 60
)
RETURNS TABLE(
  hora TEXT,
  disponivel BOOLEAN
) AS $$
DECLARE
  slot_time TIME;
  slot_end TIME;
  is_available BOOLEAN;
BEGIN
  -- Gerar slots de 8h às 20h em intervalos de 30 minutos
  FOR hour IN 8..19 LOOP
    FOR minutes IN 0..30 BY 30 LOOP
      slot_time := (hour || ':' || minutes)::TIME;
      slot_end := (slot_time + (p_duracao || ' minutes')::INTERVAL)::TIME;
      
      -- Não incluir slots que vão além das 20h
      IF EXTRACT(HOUR FROM slot_end) >= 20 AND EXTRACT(MINUTE FROM slot_end) > 0 THEN
        CONTINUE;
      END IF;
      
      -- Verificar disponibilidade
      is_available := NOT EXISTS (
        SELECT 1
        FROM painel_agendamentos a
        JOIN painel_servicos s ON a.servico_id = s.id
        WHERE a.barbeiro_id = p_barbeiro_id
          AND a.data = p_data
          AND a.status != 'cancelado'
          AND (
            -- Verifica sobreposição de horários
            (slot_time < (a.hora::TIME + (COALESCE(s.duracao, 60) || ' minutes')::INTERVAL)::TIME)
            AND
            (slot_end > a.hora::TIME)
          )
      );
      
      -- Se for hoje, verificar se já passou (com 30 min de margem)
      IF p_data = CURRENT_DATE THEN
        IF (p_data + slot_time) < (NOW() + INTERVAL '30 minutes') THEN
          is_available := FALSE;
        END IF;
      END IF;
      
      RETURN QUERY SELECT 
        TO_CHAR(slot_time, 'HH24:MI') as hora,
        is_available as disponivel;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- ================================================================
COMMENT ON FUNCTION validate_appointment_time() IS 
'Valida que o horário do agendamento não é passado (apenas para dia atual). Requer 30 minutos de antecedência mínima.';

COMMENT ON FUNCTION check_appointment_conflict() IS 
'Verifica conflitos de horário considerando a duração dos serviços. Previne duplo agendamento para o mesmo barbeiro.';

COMMENT ON FUNCTION validate_business_hours() IS 
'Valida que o horário está dentro do expediente (8h-20h) e em intervalos de 30 minutos.';

COMMENT ON FUNCTION validate_appointment_date() IS 
'Valida que a data não é passada e não ultrapassa 60 dias no futuro.';

COMMENT ON FUNCTION get_available_slots(UUID, DATE, INTEGER) IS 
'Retorna lista de horários disponíveis para um barbeiro em uma data específica, considerando duração do serviço.';
