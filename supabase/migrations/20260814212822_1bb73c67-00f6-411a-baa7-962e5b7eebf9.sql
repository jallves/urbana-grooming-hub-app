-- 1) Sequence + generator
CREATE SEQUENCE IF NOT EXISTS public.matricula_seq START WITH 1001 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.next_matricula()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT lpad(nextval('public.matricula_seq')::text, 4, '0')
$$;

-- 2) Columns
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS matricula text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS matricula text;
ALTER TABLE public.painel_barbeiros ADD COLUMN IF NOT EXISTS matricula text;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS matricula text;

-- 3) Backfill: one matricula per distinct email across all staff-side tables
WITH emails AS (
  SELECT DISTINCT lower(trim(email)) AS email FROM (
    SELECT email FROM public.employees WHERE email IS NOT NULL AND trim(email) <> ''
    UNION ALL SELECT email FROM public.staff WHERE email IS NOT NULL AND trim(email) <> ''
    UNION ALL SELECT email FROM public.painel_barbeiros WHERE email IS NOT NULL AND trim(email) <> ''
    UNION ALL SELECT email FROM public.admin_users WHERE email IS NOT NULL AND trim(email) <> ''
  ) t
), assigned AS (
  SELECT email, public.next_matricula() AS matricula FROM emails
)
UPDATE public.employees e SET matricula = a.matricula
FROM assigned a WHERE lower(trim(e.email)) = a.email AND e.matricula IS NULL;

UPDATE public.staff s SET matricula = e.matricula
FROM public.employees e WHERE lower(trim(s.email)) = lower(trim(e.email)) AND s.matricula IS NULL AND e.matricula IS NOT NULL;

UPDATE public.painel_barbeiros b SET matricula = s.matricula
FROM public.staff s WHERE lower(trim(b.email)) = lower(trim(s.email)) AND b.matricula IS NULL AND s.matricula IS NOT NULL;

UPDATE public.admin_users au SET matricula = e.matricula
FROM public.employees e WHERE lower(trim(au.email)) = lower(trim(e.email)) AND au.matricula IS NULL AND e.matricula IS NOT NULL;

-- remaining rows without a matching employee row
UPDATE public.staff SET matricula = public.next_matricula() WHERE matricula IS NULL;
UPDATE public.painel_barbeiros b SET matricula = s.matricula
FROM public.staff s WHERE lower(trim(b.email)) = lower(trim(s.email)) AND b.matricula IS NULL AND s.matricula IS NOT NULL;
UPDATE public.painel_barbeiros SET matricula = public.next_matricula() WHERE matricula IS NULL;
UPDATE public.admin_users SET matricula = public.next_matricula() WHERE matricula IS NULL;
UPDATE public.employees SET matricula = public.next_matricula() WHERE matricula IS NULL;

-- 4) Uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS employees_matricula_key ON public.employees (matricula);
CREATE UNIQUE INDEX IF NOT EXISTS staff_matricula_key ON public.staff (matricula);
CREATE UNIQUE INDEX IF NOT EXISTS painel_barbeiros_matricula_key ON public.painel_barbeiros (matricula);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_matricula_key ON public.admin_users (matricula);

-- 5) Auto-assign on insert (reuses matricula of same email when it already exists)
CREATE OR REPLACE FUNCTION public.assign_matricula()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing text;
BEGIN
  IF NEW.matricula IS NOT NULL AND trim(NEW.matricula) <> '' THEN
    RETURN NEW;
  END IF;

  IF NEW.email IS NOT NULL AND trim(NEW.email) <> '' THEN
    SELECT matricula INTO v_existing FROM (
      SELECT email, matricula FROM public.employees
      UNION ALL SELECT email, matricula FROM public.staff
      UNION ALL SELECT email, matricula FROM public.painel_barbeiros
      UNION ALL SELECT email, matricula FROM public.admin_users
    ) t
    WHERE matricula IS NOT NULL AND lower(trim(email)) = lower(trim(NEW.email))
    LIMIT 1;
  END IF;

  NEW.matricula := COALESCE(v_existing, public.next_matricula());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_matricula_employees ON public.employees;
CREATE TRIGGER trg_assign_matricula_employees BEFORE INSERT ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.assign_matricula();

DROP TRIGGER IF EXISTS trg_assign_matricula_staff ON public.staff;
CREATE TRIGGER trg_assign_matricula_staff BEFORE INSERT ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.assign_matricula();

DROP TRIGGER IF EXISTS trg_assign_matricula_barbeiros ON public.painel_barbeiros;
CREATE TRIGGER trg_assign_matricula_barbeiros BEFORE INSERT ON public.painel_barbeiros
FOR EACH ROW EXECUTE FUNCTION public.assign_matricula();

DROP TRIGGER IF EXISTS trg_assign_matricula_admin_users ON public.admin_users;
CREATE TRIGGER trg_assign_matricula_admin_users BEFORE INSERT ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.assign_matricula();

-- 6) Propagate matricula through existing sync triggers
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
        matricula = COALESCE(NEW.matricula, matricula),
        updated_at = now()
      WHERE email = NEW.email;
    ELSE
      INSERT INTO staff (name, email, phone, image_url, is_active, commission_rate, role, staff_id, matricula)
      VALUES (
        NEW.name, NEW.email, NEW.phone, NEW.photo_url,
        COALESCE(NEW.is_active, true), NEW.commission_rate, 'barber',
        NEW.user_id, NEW.matricula
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_staff_to_painel_barbeiros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_staff_id uuid;
BEGIN
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
        matricula = COALESCE(NEW.matricula, matricula),
        updated_at = now()
      WHERE staff_id = v_staff_id OR email = NEW.email;
    ELSE
      INSERT INTO painel_barbeiros (
        nome, email, telefone, image_url, foto_url,
        specialties, experience, commission_rate, taxa_comissao,
        is_active, ativo, role, staff_id, matricula
      ) VALUES (
        NEW.name, NEW.email, NEW.phone, NEW.image_url, NEW.image_url,
        NEW.specialties, NEW.experience, NEW.commission_rate, NEW.commission_rate,
        NEW.is_active, NEW.is_active, NEW.role, v_staff_id, NEW.matricula
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;