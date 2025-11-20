-- 🔧 Corrigir trigger sync_employee_to_staff para evitar recursão infinita
DROP TRIGGER IF EXISTS trigger_sync_employee_to_staff ON employees CASCADE;
DROP TRIGGER IF EXISTS sync_employee_to_staff_trigger ON employees CASCADE;
DROP FUNCTION IF EXISTS sync_employee_to_staff() CASCADE;

CREATE OR REPLACE FUNCTION public.sync_employee_to_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Proteção contra recursão: apenas executar se não estivermos já dentro de um trigger
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

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

-- Recriar trigger
CREATE TRIGGER trigger_sync_employee_to_staff
  AFTER INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_to_staff();

-- 🔧 Corrigir trigger sync_staff_to_barber para evitar recursão infinita
DROP TRIGGER IF EXISTS trigger_sync_staff_to_barber ON staff CASCADE;
DROP TRIGGER IF EXISTS sync_staff_to_barber_trigger ON staff CASCADE;
DROP FUNCTION IF EXISTS sync_staff_to_barber() CASCADE;

CREATE OR REPLACE FUNCTION public.sync_staff_to_barber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Proteção contra recursão: apenas executar se não estivermos já dentro de um trigger
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Se o funcionário tem role='barber', sincronizar com painel_barbeiros
  IF NEW.role = 'barber' THEN
    -- Inserir ou atualizar em painel_barbeiros
    INSERT INTO public.painel_barbeiros (
      nome,
      email,
      telefone,
      image_url,
      specialties,
      experience,
      commission_rate,
      is_active,
      role,
      staff_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.name,
      NEW.email,
      NEW.phone,
      NEW.image_url,
      NEW.specialties,
      NEW.experience,
      NEW.commission_rate,
      NEW.is_active,
      'barber',
      NEW.id,
      COALESCE(NEW.created_at, NOW()),
      NOW()
    )
    ON CONFLICT (staff_id) 
    DO UPDATE SET
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      telefone = EXCLUDED.telefone,
      image_url = EXCLUDED.image_url,
      specialties = EXCLUDED.specialties,
      experience = EXCLUDED.experience,
      commission_rate = EXCLUDED.commission_rate,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
      
  ELSE
    -- Se o role mudou de 'barber' para outro, remover de painel_barbeiros
    IF TG_OP = 'UPDATE' AND OLD.role = 'barber' AND NEW.role != 'barber' THEN
      DELETE FROM public.painel_barbeiros WHERE staff_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER trigger_sync_staff_to_barber
  AFTER INSERT OR UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION sync_staff_to_barber();