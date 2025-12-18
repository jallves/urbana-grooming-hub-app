-- Fix log_service_changes trigger function
CREATE OR REPLACE FUNCTION public.log_service_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
  v_admin_id UUID;
  v_entity_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- If unauthenticated, skip logging but allow DML
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Map auth user -> admin_users.id (FK target for admin_activity_log.admin_id)
  SELECT au.id INTO v_admin_id
  FROM public.admin_users au
  WHERE au.user_id = v_user_id
  LIMIT 1;

  -- If not an admin tracked in admin_users, skip logging without blocking
  IF v_admin_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Determine entity_id as UUID
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id;
  ELSE
    v_entity_id := NEW.id;
  END IF;

  -- Build action + details
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_details := jsonb_build_object('nome', NEW.nome, 'preco', NEW.preco, 'duracao', NEW.duracao);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_details := jsonb_build_object(
      'nome', NEW.nome,
      'changes', jsonb_build_object(
        'nome', CASE WHEN OLD.nome IS DISTINCT FROM NEW.nome THEN jsonb_build_object('old', OLD.nome, 'new', NEW.nome) ELSE NULL END,
        'preco', CASE WHEN OLD.preco IS DISTINCT FROM NEW.preco THEN jsonb_build_object('old', OLD.preco, 'new', NEW.preco) ELSE NULL END,
        'duracao', CASE WHEN OLD.duracao IS DISTINCT FROM NEW.duracao THEN jsonb_build_object('old', OLD.duracao, 'new', NEW.duracao) ELSE NULL END,
        'is_active', CASE WHEN OLD.is_active IS DISTINCT FROM NEW.is_active THEN jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active) ELSE NULL END
      )
    );
  ELSE
    v_action := 'delete';
    v_details := jsonb_build_object('nome', OLD.nome, 'preco', OLD.preco);
  END IF;

  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_admin_id, v_action, 'service', v_entity_id, v_details);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Fix log_barber_changes trigger function
CREATE OR REPLACE FUNCTION public.log_barber_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
  v_admin_id UUID;
  v_entity_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- If unauthenticated, skip logging but allow DML
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Map auth user -> admin_users.id (FK target for admin_activity_log.admin_id)
  SELECT au.id INTO v_admin_id
  FROM public.admin_users au
  WHERE au.user_id = v_user_id
  LIMIT 1;

  -- If not an admin tracked in admin_users, skip logging without blocking
  IF v_admin_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Determine entity_id as UUID
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id;
  ELSE
    v_entity_id := NEW.id;
  END IF;

  -- Build action + details
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_details := jsonb_build_object('nome', NEW.nome, 'email', NEW.email);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_details := jsonb_build_object(
      'nome', NEW.nome,
      'changes', jsonb_build_object(
        'nome', CASE WHEN OLD.nome IS DISTINCT FROM NEW.nome THEN jsonb_build_object('old', OLD.nome, 'new', NEW.nome) ELSE NULL END,
        'email', CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN jsonb_build_object('old', OLD.email, 'new', NEW.email) ELSE NULL END,
        'is_active', CASE WHEN OLD.is_active IS DISTINCT FROM NEW.is_active THEN jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active) ELSE NULL END
      )
    );
  ELSE
    v_action := 'delete';
    v_details := jsonb_build_object('nome', OLD.nome, 'email', OLD.email);
  END IF;

  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_admin_id, v_action, 'barber', v_entity_id, v_details);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;