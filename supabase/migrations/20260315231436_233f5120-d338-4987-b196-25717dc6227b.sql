CREATE OR REPLACE FUNCTION public.totem_checkin(
  p_agendamento_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agendamento RECORD;
  v_session RECORD;
  v_link RECORD;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT id, cliente_id, barbeiro_id, data, hora, status, status_totem
  INTO v_agendamento
  FROM painel_agendamentos
  WHERE id = p_agendamento_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  UPDATE painel_agendamentos
  SET status_totem = 'CHEGOU', status = 'confirmado', updated_at = NOW()
  WHERE id = p_agendamento_id;

  SELECT ats.id AS link_id, ts.id AS session_id, ts.token, ts.is_valid
  INTO v_link
  FROM appointment_totem_sessions ats
  JOIN totem_sessions ts ON ts.id = ats.totem_session_id
  WHERE ats.appointment_id = p_agendamento_id
  ORDER BY ats.created_at DESC
  LIMIT 1;

  IF v_link.session_id IS NOT NULL THEN
    UPDATE appointment_totem_sessions
    SET status = 'check_in'
    WHERE appointment_id = p_agendamento_id AND totem_session_id = v_link.session_id;

    RETURN json_build_object(
      'success', true,
      'session_id', v_link.session_id
    );
  END IF;

  v_token := gen_random_uuid()::TEXT;
  v_expires_at := NOW() + INTERVAL '24 hours';

  INSERT INTO totem_sessions (token, expires_at, is_valid)
  VALUES (v_token, v_expires_at, true)
  RETURNING id INTO v_session;

  INSERT INTO appointment_totem_sessions (appointment_id, totem_session_id, status)
  VALUES (p_agendamento_id, v_session.id, 'check_in');

  RETURN json_build_object(
    'success', true,
    'session_id', v_session.id
  );
END;
$$;