-- Habilitar realtime para admin_activity_log
ALTER TABLE public.admin_activity_log REPLICA IDENTITY FULL;

-- Adicionar tabela ao supabase_realtime publication se ainda não estiver
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'admin_activity_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_activity_log;
  END IF;
END $$;

-- Criar função para registrar logs automaticamente em client_profiles
CREATE OR REPLACE FUNCTION public.log_client_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
BEGIN
  -- Obter usuário atual
  v_user_id := auth.uid();
  
  -- Se não houver usuário autenticado, não registrar (evitar loops)
  IF v_user_id IS NULL THEN
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
        'data_nascimento', CASE WHEN OLD.data_nascimento IS DISTINCT FROM NEW.data_nascimento THEN jsonb_build_object('old', OLD.data_nascimento, 'new', NEW.data_nascimento) ELSE NULL END
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
  
  -- Inserir log
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_user_id, v_action, 'client', COALESCE(NEW.id, OLD.id)::TEXT, v_details);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger para client_profiles
DROP TRIGGER IF EXISTS trg_log_client_profile_changes ON public.client_profiles;
CREATE TRIGGER trg_log_client_profile_changes
AFTER INSERT OR UPDATE OR DELETE ON public.client_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_client_profile_changes();

-- Criar função para registrar logs de agendamentos
CREATE OR REPLACE FUNCTION public.log_appointment_audit_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Se não houver usuário autenticado, não registrar
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
  
  -- Inserir log
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_user_id, v_action, 'appointment', COALESCE(NEW.id, OLD.id)::TEXT, v_details);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger para painel_agendamentos
DROP TRIGGER IF EXISTS trg_log_appointment_audit_changes ON public.painel_agendamentos;
CREATE TRIGGER trg_log_appointment_audit_changes
AFTER INSERT OR UPDATE OR DELETE ON public.painel_agendamentos
FOR EACH ROW EXECUTE FUNCTION public.log_appointment_audit_changes();

-- Criar função para registrar logs de serviços
CREATE OR REPLACE FUNCTION public.log_service_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
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
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_details := jsonb_build_object('nome', OLD.nome, 'preco', OLD.preco);
  END IF;
  
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_user_id, v_action, 'service', COALESCE(NEW.id, OLD.id)::TEXT, v_details);
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_service_changes ON public.painel_servicos;
CREATE TRIGGER trg_log_service_changes
AFTER INSERT OR UPDATE OR DELETE ON public.painel_servicos
FOR EACH ROW EXECUTE FUNCTION public.log_service_changes();

-- Criar função para registrar logs de barbeiros
CREATE OR REPLACE FUNCTION public.log_barber_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
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
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_details := jsonb_build_object('nome', OLD.nome, 'email', OLD.email);
  END IF;
  
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_user_id, v_action, 'barber', COALESCE(NEW.id, OLD.id)::TEXT, v_details);
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_barber_changes ON public.painel_barbeiros;
CREATE TRIGGER trg_log_barber_changes
AFTER INSERT OR UPDATE OR DELETE ON public.painel_barbeiros
FOR EACH ROW EXECUTE FUNCTION public.log_barber_changes();

-- Criar função para registrar logs de staff
CREATE OR REPLACE FUNCTION public.log_staff_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_details := jsonb_build_object('name', NEW.name, 'email', NEW.email, 'role', NEW.role);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_details := jsonb_build_object(
      'name', NEW.name,
      'changes', jsonb_build_object(
        'name', CASE WHEN OLD.name IS DISTINCT FROM NEW.name THEN jsonb_build_object('old', OLD.name, 'new', NEW.name) ELSE NULL END,
        'email', CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN jsonb_build_object('old', OLD.email, 'new', NEW.email) ELSE NULL END,
        'is_active', CASE WHEN OLD.is_active IS DISTINCT FROM NEW.is_active THEN jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active) ELSE NULL END,
        'commission_rate', CASE WHEN OLD.commission_rate IS DISTINCT FROM NEW.commission_rate THEN jsonb_build_object('old', OLD.commission_rate, 'new', NEW.commission_rate) ELSE NULL END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_details := jsonb_build_object('name', OLD.name, 'email', OLD.email);
  END IF;
  
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_user_id, v_action, 'staff', COALESCE(NEW.id, OLD.id)::TEXT, v_details);
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_staff_changes ON public.staff;
CREATE TRIGGER trg_log_staff_changes
AFTER INSERT OR UPDATE OR DELETE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.log_staff_changes();

-- Criar função para registrar logs de transações financeiras
CREATE OR REPLACE FUNCTION public.log_financial_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
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
        'gross_amount', CASE WHEN OLD.gross_amount IS DISTINCT FROM NEW.gross_amount THEN jsonb_build_object('old', OLD.gross_amount, 'new', NEW.gross_amount) ELSE NULL END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_details := jsonb_build_object('description', OLD.description, 'gross_amount', OLD.gross_amount);
  END IF;
  
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_user_id, v_action, 'financial', COALESCE(NEW.id, OLD.id)::TEXT, v_details);
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_financial_changes ON public.financial_records;
CREATE TRIGGER trg_log_financial_changes
AFTER INSERT OR UPDATE OR DELETE ON public.financial_records
FOR EACH ROW EXECUTE FUNCTION public.log_financial_changes();

-- Criar função para registrar logs de produtos
CREATE OR REPLACE FUNCTION public.log_product_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_details JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_details := jsonb_build_object('nome', NEW.nome, 'preco', NEW.preco, 'estoque', NEW.estoque);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_details := jsonb_build_object(
      'nome', NEW.nome,
      'changes', jsonb_build_object(
        'nome', CASE WHEN OLD.nome IS DISTINCT FROM NEW.nome THEN jsonb_build_object('old', OLD.nome, 'new', NEW.nome) ELSE NULL END,
        'preco', CASE WHEN OLD.preco IS DISTINCT FROM NEW.preco THEN jsonb_build_object('old', OLD.preco, 'new', NEW.preco) ELSE NULL END,
        'estoque', CASE WHEN OLD.estoque IS DISTINCT FROM NEW.estoque THEN jsonb_build_object('old', OLD.estoque, 'new', NEW.estoque) ELSE NULL END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_details := jsonb_build_object('nome', OLD.nome, 'preco', OLD.preco);
  END IF;
  
  INSERT INTO public.admin_activity_log (admin_id, action, entity, entity_id, details)
  VALUES (v_user_id, v_action, 'product', COALESCE(NEW.id, OLD.id)::TEXT, v_details);
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_product_changes ON public.painel_produtos;
CREATE TRIGGER trg_log_product_changes
AFTER INSERT OR UPDATE OR DELETE ON public.painel_produtos
FOR EACH ROW EXECUTE FUNCTION public.log_product_changes();