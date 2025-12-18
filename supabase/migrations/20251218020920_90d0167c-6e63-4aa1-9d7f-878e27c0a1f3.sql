-- Fix log_financial_changes trigger function (was writing entity_id as text and admin_id as auth.uid)
CREATE OR REPLACE FUNCTION public.log_financial_changes()
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

  -- If unauthenticated, do not block DML; just skip logging
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Map auth user -> admin_users.id (FK target for admin_activity_log.admin_id)
  SELECT au.id
    INTO v_admin_id
  FROM public.admin_users au
  WHERE au.user_id = v_user_id
  LIMIT 1;

  -- If not an admin/staff tracked in admin_users, skip logging without blocking
  IF v_admin_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
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
    v_details := jsonb_build_object(
      'description', NEW.description,
      'gross_amount', NEW.gross_amount,
      'transaction_type', NEW.transaction_type,
      'category', NEW.category
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_details := jsonb_build_object(
      'description', NEW.description,
      'changes', jsonb_build_object(
        'status', CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) ELSE NULL END,
        'gross_amount', CASE WHEN OLD.gross_amount IS DISTINCT FROM NEW.gross_amount THEN jsonb_build_object('old', OLD.gross_amount, 'new', NEW.gross_amount) ELSE NULL END,
        'net_amount', CASE WHEN OLD.net_amount IS DISTINCT FROM NEW.net_amount THEN jsonb_build_object('old', OLD.net_amount, 'new', NEW.net_amount) ELSE NULL END
      )
    );
  ELSE
    v_action := 'delete';
    v_details := jsonb_build_object(
      'description', OLD.description,
      'gross_amount', OLD.gross_amount,
      'transaction_type', OLD.transaction_type,
      'category', OLD.category
    );
  END IF;

  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_admin_id, v_action, 'financial', v_entity_id, v_details);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;