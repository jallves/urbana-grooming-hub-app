CREATE OR REPLACE FUNCTION public.register_presence(p_user_agent text DEFAULT NULL, p_device_info jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_name text;
  v_role text;
  v_type text;
  v_session_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.email, COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name')
    INTO v_email, v_name
  FROM auth.users u WHERE u.id = v_uid;

  SELECT r.role::text INTO v_role FROM public.user_roles r WHERE r.user_id = v_uid LIMIT 1;

  v_type := CASE
    WHEN v_role IN ('master','admin','manager') THEN 'admin'
    WHEN v_role = 'barber' THEN 'barber'
    WHEN v_role = 'client' THEN 'painel_cliente'
    ELSE NULL
  END;

  IF v_type IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.painel_barbeiros b WHERE b.email = v_email) THEN
      v_type := 'barber';
    ELSIF EXISTS (SELECT 1 FROM public.painel_clientes c WHERE c.user_id = v_uid OR c.email = v_email) THEN
      v_type := 'painel_cliente';
    ELSE
      v_type := 'user';
    END IF;
  END IF;

  IF v_name IS NULL THEN
    SELECT c.nome INTO v_name FROM public.painel_clientes c WHERE c.user_id = v_uid OR c.email = v_email LIMIT 1;
  END IF;
  IF v_name IS NULL THEN
    SELECT s.name INTO v_name FROM public.staff s WHERE s.email = v_email LIMIT 1;
  END IF;

  SELECT s.id INTO v_session_id
  FROM public.active_sessions s
  WHERE s.user_id = v_uid AND s.user_type = v_type AND s.is_active = true AND s.expires_at > now()
  ORDER BY s.last_activity_at DESC
  LIMIT 1;

  IF v_session_id IS NOT NULL THEN
    UPDATE public.active_sessions
    SET last_activity_at = now(),
        user_email = COALESCE(user_email, v_email),
        user_name = COALESCE(user_name, v_name),
        user_agent = COALESCE(p_user_agent, user_agent),
        device_info = COALESCE(p_device_info, device_info)
    WHERE id = v_session_id;
    RETURN v_session_id;
  END IF;

  INSERT INTO public.active_sessions (user_id, user_type, user_email, user_name, user_agent, device_info, expires_at)
  VALUES (v_uid, v_type, v_email, v_name, p_user_agent, p_device_info, now() + interval '24 hours')
  RETURNING id INTO v_session_id;

  PERFORM public.log_admin_activity('login', 'session', v_session_id, NULL,
    jsonb_build_object('user_email', v_email, 'user_type', v_type));

  RETURN v_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_presence(text, jsonb) TO authenticated;