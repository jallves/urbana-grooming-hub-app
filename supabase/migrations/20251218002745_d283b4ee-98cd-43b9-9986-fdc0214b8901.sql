-- Corrigir função log_appointment_audit_changes que estava convertendo UUID para TEXT
CREATE OR REPLACE FUNCTION public.log_appointment_audit_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
  v_client_name TEXT;
  v_barber_name TEXT;
  v_service_name TEXT;
BEGIN
  -- Obter usuário atual
  v_user_id := auth.uid();
  
  -- Se não houver usuário autenticado, não registrar log mas permitir operação
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  -- Buscar nomes para contexto
  IF TG_OP != 'DELETE' THEN
    SELECT nome INTO v_client_name FROM client_profiles WHERE id = NEW.cliente_id;
    SELECT nome INTO v_barber_name FROM painel_barbeiros WHERE id = NEW.barbeiro_id;
    SELECT nome INTO v_service_name FROM painel_servicos WHERE id = NEW.servico_id;
  ELSE
    SELECT nome INTO v_client_name FROM client_profiles WHERE id = OLD.cliente_id;
    SELECT nome INTO v_barber_name FROM painel_barbeiros WHERE id = OLD.barbeiro_id;
    SELECT nome INTO v_service_name FROM painel_servicos WHERE id = OLD.servico_id;
  END IF;
  
  -- Determinar ação
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_details := jsonb_build_object(
      'cliente', v_client_name,
      'barbeiro', v_barber_name,
      'servico', v_service_name,
      'data', NEW.data,
      'hora', NEW.hora::TEXT,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Verificar se é uma mudança de status específica
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := CASE NEW.status
        WHEN 'cancelado' THEN 'cancel'
        WHEN 'concluido' THEN 'complete'
        WHEN 'ausente' THEN 'absent'
        ELSE 'update'
      END;
    ELSE
      v_action := 'update';
    END IF;
    
    v_details := jsonb_build_object(
      'cliente', v_client_name,
      'barbeiro', v_barber_name,
      'servico', v_service_name,
      'data', NEW.data,
      'hora', NEW.hora::TEXT,
      'changes', jsonb_build_object(
        'status', CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) ELSE NULL END,
        'data', CASE WHEN OLD.data IS DISTINCT FROM NEW.data THEN jsonb_build_object('old', OLD.data, 'new', NEW.data) ELSE NULL END,
        'hora', CASE WHEN OLD.hora IS DISTINCT FROM NEW.hora THEN jsonb_build_object('old', OLD.hora::TEXT, 'new', NEW.hora::TEXT) ELSE NULL END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_details := jsonb_build_object(
      'cliente', v_client_name,
      'barbeiro', v_barber_name,
      'servico', v_service_name,
      'data', OLD.data,
      'hora', OLD.hora::TEXT,
      'status', OLD.status
    );
  END IF;
  
  -- Inserir log - CORRIGIDO: removido ::TEXT que causava erro de tipo
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_user_id, v_action, 'appointment', COALESCE(NEW.id, OLD.id), v_details);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;