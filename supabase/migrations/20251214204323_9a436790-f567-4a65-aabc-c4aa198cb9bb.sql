-- Corrigir trigger para verificar se admin_id existe em admin_users antes de inserir log
CREATE OR REPLACE FUNCTION log_client_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
  v_entity_id UUID;
  v_admin_exists BOOLEAN;
BEGIN
  -- Obter usuário atual
  v_user_id := auth.uid();
  
  -- Obter entity_id corretamente como UUID
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id;
  ELSE
    v_entity_id := NEW.id;
  END IF;
  
  -- Se não houver usuário autenticado, não registrar
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Verificar se o usuário existe em admin_users (por causa da foreign key)
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users WHERE user_id = v_user_id
  ) INTO v_admin_exists;
  
  -- Se não for um admin registrado, pular o log mas permitir a operação
  IF NOT v_admin_exists THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Determinar ação
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_details := jsonb_build_object(
      'nome', NEW.nome,
      'email', NEW.email,
      'whatsapp', NEW.whatsapp
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_details := jsonb_build_object(
      'changes', jsonb_build_object(
        'nome', CASE WHEN OLD.nome IS DISTINCT FROM NEW.nome THEN jsonb_build_object('old', OLD.nome, 'new', NEW.nome) ELSE NULL END,
        'email', CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN jsonb_build_object('old', OLD.email, 'new', NEW.email) ELSE NULL END,
        'whatsapp', CASE WHEN OLD.whatsapp IS DISTINCT FROM NEW.whatsapp THEN jsonb_build_object('old', OLD.whatsapp, 'new', NEW.whatsapp) ELSE NULL END,
        'data_nascimento', CASE WHEN OLD.data_nascimento IS DISTINCT FROM NEW.data_nascimento THEN jsonb_build_object('old', OLD.data_nascimento::TEXT, 'new', NEW.data_nascimento::TEXT) ELSE NULL END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_details := jsonb_build_object(
      'nome', OLD.nome,
      'email', OLD.email,
      'whatsapp', OLD.whatsapp
    );
  END IF;
  
  -- Inserir log - buscar o ID do admin_users (não o user_id do auth)
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  SELECT au.id, v_action, 'client', v_entity_id, v_details
  FROM public.admin_users au
  WHERE au.user_id = v_user_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;