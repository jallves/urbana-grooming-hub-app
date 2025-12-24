-- Dropar função com tipo de retorno diferente
DROP FUNCTION IF EXISTS public.cleanup_expired_sessions();

-- Recriar com o tipo correto e search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.user_sessions
  SET is_active = false, logout_at = NOW()
  WHERE is_active = true AND expires_at < NOW();
  
  DELETE FROM public.client_sessions WHERE expires_at < NOW();
END;
$function$;

-- Corrigir funções de trigger
CREATE OR REPLACE FUNCTION public.audit_appointment_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO barber_audit_log (action, description, performed_by)
  VALUES ('appointment_deleted', format('Agendamento deletado - ID: %s', OLD.id), auth.uid());
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_barber_to_employee()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.role = 'barber' AND NEW.email IS NOT NULL THEN
      INSERT INTO public.employees (name, email, phone, role, status, photo_url, created_at, updated_at)
      VALUES (NEW.name, NEW.email, NEW.phone, 'barber',
        CASE WHEN NEW.is_active THEN 'active' ELSE 'inactive' END,
        NEW.image_url, NEW.created_at, NEW.updated_at)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name, phone = EXCLUDED.phone, status = EXCLUDED.status,
        photo_url = EXCLUDED.photo_url, updated_at = EXCLUDED.updated_at;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.employees WHERE email = OLD.email AND role = 'barber';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_employee_to_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
      DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = OLD.role::app_role;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_services_to_painel()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  UPDATE painel_servicos ps SET nome = NEW.name, preco = NEW.price, duracao = NEW.duration,
    descricao = NEW.description, is_active = NEW.is_active, updated_at = NOW()
  WHERE ps.id IN (SELECT painel_servicos_id FROM service_id_mapping WHERE services_id = NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_profiles_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.update_clients_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.update_service_mapping_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.validate_appointment_time()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  appointment_datetime TIMESTAMP WITH TIME ZONE;
  min_allowed_time TIMESTAMP WITH TIME ZONE;
  current_brazil_time TIMESTAMP WITH TIME ZONE;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.data = NEW.data AND OLD.hora = NEW.hora THEN RETURN NEW; END IF;
  END IF;
  current_brazil_time := NOW() AT TIME ZONE 'America/Sao_Paulo';
  appointment_datetime := (NEW.data::TEXT || ' ' || NEW.hora::TEXT)::TIMESTAMP AT TIME ZONE 'America/Sao_Paulo';
  min_allowed_time := current_brazil_time - INTERVAL '10 minutes';
  IF appointment_datetime < min_allowed_time THEN
    RAISE EXCEPTION 'Horário não disponível';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_appointment_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  has_financial_records BOOLEAN;
  appointment_status TEXT;
BEGIN
  SELECT status INTO appointment_status FROM painel_agendamentos WHERE id = OLD.id;
  SELECT EXISTS (
    SELECT 1 FROM financial_records WHERE appointment_id = OLD.id
    UNION ALL SELECT 1 FROM finance_transactions WHERE agendamento_id = OLD.id
    UNION ALL SELECT 1 FROM comissoes WHERE agendamento_id = OLD.id
    UNION ALL SELECT 1 FROM vendas WHERE agendamento_id = OLD.id
  ) INTO has_financial_records;
  IF appointment_status = 'concluido' THEN RAISE EXCEPTION 'Não é possível deletar agendamento concluído'; END IF;
  IF has_financial_records THEN RAISE EXCEPTION 'Não é possível deletar agendamento com registros financeiros'; END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_commission_automatically()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  barber_commission_type TEXT; barber_commission_value NUMERIC;
  service_price NUMERIC; commission_amount NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT commission_type, commission_value INTO barber_commission_type, barber_commission_value
    FROM public.barbers WHERE id = NEW.barber_id;
    SELECT price INTO service_price FROM public.services WHERE id = NEW.service_id;
    IF barber_commission_type = 'percent' THEN commission_amount := service_price * (barber_commission_value / 100);
    ELSE commission_amount := barber_commission_value; END IF;
    INSERT INTO public.new_commissions (appointment_id, barber_id, amount)
    VALUES (NEW.id, NEW.barber_id, commission_amount);
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_commission_painel()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  staff_commission_rate NUMERIC; service_price NUMERIC; commission_amount NUMERIC;
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    SELECT s.commission_rate INTO staff_commission_rate
    FROM public.staff s INNER JOIN public.painel_barbeiros pb ON s.id = pb.staff_id
    WHERE pb.id = NEW.barbeiro_id;
    SELECT preco INTO service_price FROM public.painel_servicos WHERE id = NEW.servico_id;
    IF staff_commission_rate IS NOT NULL AND service_price IS NOT NULL THEN
      commission_amount := service_price * (staff_commission_rate / 100);
      INSERT INTO public.barber_commissions (appointment_id, barber_id, amount, commission_rate, status)
      VALUES (NEW.id, (SELECT staff_id FROM public.painel_barbeiros WHERE id = NEW.barbeiro_id),
        commission_amount, staff_commission_rate, 'pending');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_commission_status_on_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'PAGA' AND (OLD.status IS NULL OR OLD.status != 'PAGA') THEN
    UPDATE barber_commissions SET status = 'paid', payment_date = NOW(), updated_at = NOW()
    WHERE appointment_id = NEW.agendamento_id AND appointment_source = 'painel' AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_commission_on_appointment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE barber_commissions SET status = 'paid', payment_date = NOW(), updated_at = NOW()
    WHERE appointment_id = NEW.id AND appointment_source = 'appointments' AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$function$;