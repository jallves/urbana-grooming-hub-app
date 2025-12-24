-- ============================================
-- 2. CORRIGIR FUNÇÕES SEM SEARCH_PATH
-- ============================================

-- Trigger functions (não precisam de SECURITY DEFINER, só search_path)
CREATE OR REPLACE FUNCTION public.update_employees_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_painel_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_totem_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE public.painel_produtos
  SET estoque = estoque - NEW.quantidade,
      updated_at = now()
  WHERE id = NEW.produto_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_financial_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_barber_availability_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- SECURITY DEFINER functions - adicionar search_path
CREATE OR REPLACE FUNCTION public.check_painel_cliente_email(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.painel_clientes 
    WHERE email = email_to_check
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, user_type)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        NEW.email,
        'user'
    );
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_painel_cliente(nome text, email text, whatsapp text, senha_hash text)
RETURNS painel_clientes_legacy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  novo_cliente public.painel_clientes;
BEGIN
  INSERT INTO public.painel_clientes (nome, email, whatsapp, senha_hash)
  VALUES (nome, email, whatsapp, senha_hash)
  RETURNING * INTO novo_cliente;
  
  RETURN novo_cliente;
END;
$function$;

CREATE OR REPLACE FUNCTION public.authenticate_painel_cliente(email text, senha_hash text)
RETURNS painel_clientes_legacy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  cliente_data public.painel_clientes;
BEGIN
  SELECT * INTO cliente_data
  FROM public.painel_clientes
  WHERE painel_clientes.email = authenticate_painel_cliente.email
    AND painel_clientes.senha_hash = authenticate_painel_cliente.senha_hash;
  
  RETURN cliente_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_painel_cliente_by_id(cliente_id uuid)
RETURNS painel_clientes_legacy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  cliente_data public.painel_clientes;
BEGIN
  SELECT * INTO cliente_data
  FROM public.painel_clientes
  WHERE id = cliente_id;
  
  RETURN cliente_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_appointment_conflict(p_staff_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.appointments 
    WHERE staff_id = p_staff_id
    AND status IN ('scheduled', 'confirmed')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_barber_user(p_email text, p_name text, p_role text DEFAULT 'barber'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO public.admin_users (email, name, role, created_at)
  VALUES (p_email, p_name, p_role, now())
  RETURNING id INTO v_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, p_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN v_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_staff_module_access(staff_id_param uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  modules text[];
BEGIN
  SELECT array_agg(module_id) INTO modules
  FROM public.staff_module_access
  WHERE staff_id = staff_id_param;
  
  RETURN modules;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_staff_module_access(staff_id_param uuid, module_ids_param text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.staff_module_access WHERE staff_id = staff_id_param;
  
  IF module_ids_param IS NOT NULL AND array_length(module_ids_param, 1) > 0 THEN
    INSERT INTO public.staff_module_access (staff_id, module_id)
    SELECT staff_id_param, unnest(module_ids_param);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.invalidate_all_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.user_sessions
  SET 
    is_active = FALSE,
    logout_at = NOW()
  WHERE is_active = TRUE;
  
  RAISE NOTICE 'Todas as sessões foram invalidadas';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN current_setting('request.headers', true)::json->>'x-real-ip';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_all_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE user_sessions
  SET is_active = false,
      last_activity_at = NOW()
  WHERE is_active = true;
  
  RAISE NOTICE 'Todas as sessões foram marcadas como inativas';
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_painel_cliente_with_birth_date(nome text, email text, whatsapp text, data_nascimento date, senha_hash text)
RETURNS painel_clientes_legacy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  novo_cliente public.painel_clientes;
BEGIN
  INSERT INTO public.painel_clientes (nome, email, whatsapp, data_nascimento, senha_hash)
  VALUES (nome, email, whatsapp, data_nascimento, senha_hash)
  RETURNING * INTO novo_cliente;
  
  RETURN novo_cliente;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_staff_member(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff
    WHERE email = user_email
      AND is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.clean_expired_client_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.client_sessions 
  WHERE expires_at < NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_client_appointment_conflict(p_client_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.appointments 
    WHERE client_id = p_client_id
    AND status IN ('scheduled', 'confirmed')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_client_age(birth_date date)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date)) >= 14;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_painel_barbeiros()
RETURNS SETOF painel_barbeiros
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM public.painel_barbeiros
  ORDER BY nome;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_painel_servicos()
RETURNS SETOF painel_servicos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM public.painel_servicos
  ORDER BY nome;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_agendamentos_barbeiro_data(barbeiro_id uuid, data_agendamento date)
RETURNS TABLE(id uuid, hora time without time zone, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.hora,
    a.status
  FROM public.painel_agendamentos a
  WHERE a.barbeiro_id = get_agendamentos_barbeiro_data.barbeiro_id
    AND a.data = data_agendamento
    AND a.status != 'cancelado';
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_painel_cliente(cliente_id uuid, nome text DEFAULT NULL::text, email text DEFAULT NULL::text, whatsapp text DEFAULT NULL::text)
RETURNS painel_clientes_legacy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  cliente_atualizado public.painel_clientes;
BEGIN
  UPDATE public.painel_clientes
  SET 
    nome = COALESCE(update_painel_cliente.nome, painel_clientes.nome),
    email = COALESCE(update_painel_cliente.email, painel_clientes.email),
    whatsapp = COALESCE(update_painel_cliente.whatsapp, painel_clientes.whatsapp),
    updated_at = now()
  WHERE id = cliente_id
  RETURNING * INTO cliente_atualizado;
  
  RETURN cliente_atualizado;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_painel_cliente_with_birth_date(cliente_id uuid, nome text DEFAULT NULL::text, email text DEFAULT NULL::text, whatsapp text DEFAULT NULL::text, data_nascimento date DEFAULT NULL::date)
RETURNS painel_clientes_legacy
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  cliente_atualizado public.painel_clientes;
BEGIN
  UPDATE public.painel_clientes
  SET 
    nome = COALESCE(update_painel_cliente_with_birth_date.nome, painel_clientes.nome),
    email = COALESCE(update_painel_cliente_with_birth_date.email, painel_clientes.email),
    whatsapp = COALESCE(update_painel_cliente_with_birth_date.whatsapp, painel_clientes.whatsapp),
    data_nascimento = COALESCE(update_painel_cliente_with_birth_date.data_nascimento, painel_clientes.data_nascimento),
    updated_at = now()
  WHERE id = cliente_id
  RETURNING * INTO cliente_atualizado;
  
  RETURN cliente_atualizado;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_sessions_by_type(p_user_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE user_sessions
  SET is_active = false,
      last_activity_at = NOW()
  WHERE is_active = true
    AND user_type = p_user_type;
  
  RAISE NOTICE 'Sessões do tipo % foram marcadas como inativas', p_user_type;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    new_number := 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                  LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    SELECT EXISTS(SELECT 1 FROM financial_records WHERE transaction_number = new_number) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN new_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_payment_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    new_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                  LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    SELECT EXISTS(SELECT 1 FROM payment_records WHERE payment_number = new_number) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN new_number;
END;
$function$;