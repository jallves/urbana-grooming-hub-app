-- Corrigir trigger para permitir mudanças de status em datas passadas
-- mas bloquear mudanças na data em si

CREATE OR REPLACE FUNCTION validate_appointment_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir mudanças de status em agendamentos passados
  -- Bloquear apenas se a DATA está sendo alterada para o passado
  IF (TG_OP = 'UPDATE' AND OLD.data IS DISTINCT FROM NEW.data) OR TG_OP = 'INSERT' THEN
    IF NEW.data < CURRENT_DATE THEN
      RAISE EXCEPTION 'Data inválida: não é possível agendar para datas passadas. Data solicitada: %, Data atual: %', 
        NEW.data, CURRENT_DATE;
    END IF;
    
    -- Validar que não ultrapassa 60 dias no futuro
    IF NEW.data > CURRENT_DATE + INTERVAL '60 days' THEN
      RAISE EXCEPTION 'Data inválida: não é possível agendar com mais de 60 dias de antecedência';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_appointment_date() IS 
'Valida mudanças na data do agendamento. Permite mudanças de status em agendamentos passados, mas bloqueia alteração da data para o passado.';