
CREATE OR REPLACE FUNCTION public.cancel_appointment_by_client(p_appointment_id uuid, p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_appointment RECORD;
BEGIN
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id AND client_id = p_client_id;

  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado.');
  END IF;

  IF v_appointment.status NOT IN ('scheduled', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este agendamento não pode ser cancelado.');
  END IF;

  -- Regra: mínimo 3 horas de antecedência
  IF v_appointment.start_time < (now() + interval '3 hours') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cancelamento permitido apenas com 3 horas de antecedência. Entre em contato com o barbeiro.');
  END IF;

  UPDATE appointments
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_appointment_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
