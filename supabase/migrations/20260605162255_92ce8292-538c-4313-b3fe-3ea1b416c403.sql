
-- Quebra do loop infinito entre triggers staff <-> painel_barbeiros usando pg_trigger_depth().
-- O loop acontecia ao inativar/editar barbeiro: staff -> painel_barbeiros -> staff -> ...

CREATE OR REPLACE FUNCTION public.sync_staff_to_painel_barbeiros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Evita recursão: só roda na chamada raiz
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'barber' THEN
    v_staff_id := COALESCE(NEW.staff_id, NEW.id);

    IF EXISTS (
      SELECT 1 FROM painel_barbeiros 
      WHERE staff_id = v_staff_id OR email = NEW.email
    ) THEN
      UPDATE painel_barbeiros SET
        nome = NEW.name,
        email = NEW.email,
        telefone = NEW.phone,
        image_url = NEW.image_url,
        foto_url = NEW.image_url,
        specialties = NEW.specialties,
        experience = NEW.experience,
        commission_rate = NEW.commission_rate,
        taxa_comissao = NEW.commission_rate,
        is_active = NEW.is_active,
        ativo = NEW.is_active,
        role = NEW.role,
        staff_id = v_staff_id,
        updated_at = now()
      WHERE staff_id = v_staff_id OR email = NEW.email;
    ELSE
      INSERT INTO painel_barbeiros (
        nome, email, telefone, image_url, foto_url,
        specialties, experience, commission_rate, taxa_comissao,
        is_active, ativo, role, staff_id
      ) VALUES (
        NEW.name, NEW.email, NEW.phone, NEW.image_url, NEW.image_url,
        NEW.specialties, NEW.experience, NEW.commission_rate, NEW.commission_rate,
        NEW.is_active, NEW.is_active, NEW.role, v_staff_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_painel_commission_to_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rate NUMERIC;
BEGIN
  v_rate := COALESCE(NEW.commission_rate, NEW.taxa_comissao);
  IF v_rate IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.commission_rate IS DISTINCT FROM v_rate OR NEW.taxa_comissao IS DISTINCT FROM v_rate THEN
    NEW.commission_rate := v_rate;
    NEW.taxa_comissao   := v_rate;
  END IF;

  -- Evita loop com sync_staff_to_painel_barbeiros
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  UPDATE public.staff s
  SET commission_rate = v_rate,
      updated_at = now()
  WHERE s.commission_rate IS DISTINCT FROM v_rate
    AND (
      (s.id = NEW.staff_id)
      OR (NEW.email IS NOT NULL AND lower(trim(s.email)) = lower(trim(NEW.email)))
      OR (lower(trim(s.name)) = lower(trim(NEW.nome)))
    );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_staff_commission_to_painel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.commission_rate IS NOT DISTINCT FROM OLD.commission_rate THEN
    RETURN NEW;
  END IF;

  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  UPDATE public.painel_barbeiros pb
  SET commission_rate = NEW.commission_rate,
      taxa_comissao   = NEW.commission_rate,
      updated_at      = now()
  WHERE (pb.commission_rate IS DISTINCT FROM NEW.commission_rate
         OR pb.taxa_comissao IS DISTINCT FROM NEW.commission_rate)
    AND (
      (pb.staff_id = NEW.id)
      OR (NEW.email IS NOT NULL AND lower(trim(pb.email)) = lower(trim(NEW.email)))
      OR (lower(trim(pb.nome)) = lower(trim(NEW.name)))
    );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_employee_to_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'barber' THEN
    IF EXISTS (SELECT 1 FROM staff WHERE email = NEW.email) THEN
      UPDATE staff SET
        staff_id = COALESCE(NEW.user_id, staff_id),
        name = NEW.name,
        email = NEW.email,
        phone = NEW.phone,
        image_url = COALESCE(NEW.photo_url, image_url),
        is_active = COALESCE(NEW.is_active, true),
        commission_rate = NEW.commission_rate,
        role = 'barber',
        updated_at = now()
      WHERE email = NEW.email;
    ELSE
      INSERT INTO staff (name, email, phone, image_url, is_active, commission_rate, role, staff_id)
      VALUES (
        NEW.name, NEW.email, NEW.phone, NEW.photo_url,
        COALESCE(NEW.is_active, true), NEW.commission_rate, 'barber',
        NEW.user_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
