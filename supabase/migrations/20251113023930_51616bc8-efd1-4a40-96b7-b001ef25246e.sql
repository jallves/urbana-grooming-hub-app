-- ============================================================================
-- SISTEMA ROBUSTO DE AUTENTICAÇÃO DE BARBEIROS
-- Migração para garantir fluxo completo de funcionários → barbeiros → auth
-- ============================================================================

-- 1. Garantir que a coluna user_id existe na tabela staff
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- 3. Adicionar coluna para controlar senha temporária
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS requires_password_change boolean DEFAULT false;

-- 4. Função para criar usuário barbeiro com senha temporária
CREATE OR REPLACE FUNCTION public.create_barber_auth_user(
  p_email text,
  p_password text,
  p_name text,
  p_staff_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_existing_user_id uuid;
  v_result jsonb;
BEGIN
  -- Verificar se já existe um usuário com este email
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_existing_user_id IS NOT NULL THEN
    -- Usuário já existe, atualizar senha e metadados
    UPDATE auth.users
    SET 
      raw_user_meta_data = jsonb_build_object(
        'name', p_name,
        'role', 'barber',
        'staff_id', p_staff_id,
        'requires_password_change', true
      ),
      encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = now()
    WHERE id = v_existing_user_id;

    -- Atualizar staff com user_id
    UPDATE public.staff
    SET 
      user_id = v_existing_user_id,
      requires_password_change = true,
      updated_at = now()
    WHERE id = p_staff_id;

    -- Garantir que existe role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_existing_user_id, 'barber'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    v_user_id := v_existing_user_id;
  ELSE
    -- Criar novo usuário
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object(
        'name', p_name,
        'role', 'barber',
        'staff_id', p_staff_id,
        'requires_password_change', true
      ),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;

    -- Atualizar staff com user_id
    UPDATE public.staff
    SET 
      user_id = v_user_id,
      requires_password_change = true,
      updated_at = now()
    WHERE id = p_staff_id;

    -- Criar role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'barber'::app_role);
  END IF;

  -- Retornar sucesso
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', CASE 
      WHEN v_existing_user_id IS NOT NULL 
      THEN 'Usuário atualizado com sucesso' 
      ELSE 'Usuário criado com sucesso' 
    END
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- 5. Função para desabilitar usuário barbeiro
CREATE OR REPLACE FUNCTION public.disable_barber_auth_user(
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = v_user_id AND role = 'barber'::app_role;

  UPDATE public.staff
  SET 
    user_id = NULL,
    requires_password_change = false,
    updated_at = now()
  WHERE user_id = v_user_id;

  UPDATE auth.users
  SET 
    banned_until = 'infinity'::timestamp,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuário desabilitado com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 6. Função para verificar se usuário existe
CREATE OR REPLACE FUNCTION public.check_barber_auth_exists(
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    INNER JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.email = p_email
      AND ur.role = 'barber'::app_role
      AND (u.banned_until IS NULL OR u.banned_until < now())
  ) INTO v_exists;

  RETURN v_exists;
END;
$$;

-- 7. Trigger para sincronização automática employees → staff
CREATE OR REPLACE FUNCTION public.sync_employee_to_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'barber' THEN
    IF NOT EXISTS (SELECT 1 FROM public.staff WHERE email = NEW.email) THEN
      INSERT INTO public.staff (
        name, email, phone, role, is_active, image_url, commission_rate
      ) VALUES (
        NEW.name, NEW.email, NEW.phone, 'barber', 
        NEW.status = 'active', NEW.photo_url, COALESCE(NEW.commission_rate, 40)
      );
    ELSE
      UPDATE public.staff
      SET
        name = NEW.name,
        phone = NEW.phone,
        is_active = NEW.status = 'active',
        image_url = NEW.photo_url,
        commission_rate = COALESCE(NEW.commission_rate, 40),
        updated_at = now()
      WHERE email = NEW.email;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_employee_to_staff ON public.employees;
CREATE TRIGGER trigger_sync_employee_to_staff
  AFTER INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_to_staff();

GRANT EXECUTE ON FUNCTION public.create_barber_auth_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_barber_auth_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_barber_auth_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_employee_to_staff TO authenticated;