
-- Trigger function: when a barber is inserted/updated in staff, ensure painel_barbeiros is synced
CREATE OR REPLACE FUNCTION public.sync_staff_to_painel_barbeiros()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  -- Only sync barbers
  IF NEW.role = 'barber' THEN
    v_staff_id := COALESCE(NEW.staff_id, NEW.id);
    
    -- Check if already exists in painel_barbeiros by staff_id or email
    IF EXISTS (
      SELECT 1 FROM painel_barbeiros 
      WHERE staff_id = v_staff_id
         OR email = NEW.email
    ) THEN
      -- Update existing record
      UPDATE painel_barbeiros SET
        nome = NEW.name,
        email = NEW.email,
        telefone = NEW.phone,
        image_url = NEW.image_url,
        foto_url = NEW.image_url,
        specialties = NEW.specialties,
        experience = NEW.experience,
        commission_rate = NEW.commission_rate,
        is_active = NEW.is_active,
        ativo = NEW.is_active,
        role = NEW.role,
        staff_id = v_staff_id,
        updated_at = now()
      WHERE staff_id = v_staff_id
         OR email = NEW.email;
    ELSE
      -- Insert new record
      INSERT INTO painel_barbeiros (
        nome, email, telefone, image_url, foto_url,
        specialties, experience, commission_rate,
        is_active, ativo, role, staff_id
      ) VALUES (
        NEW.name, NEW.email, NEW.phone, NEW.image_url, NEW.image_url,
        NEW.specialties, NEW.experience, NEW.commission_rate,
        NEW.is_active, NEW.is_active, NEW.role, v_staff_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on staff table
DROP TRIGGER IF EXISTS trigger_sync_staff_to_painel_barbeiros ON staff;
CREATE TRIGGER trigger_sync_staff_to_painel_barbeiros
  AFTER INSERT OR UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION sync_staff_to_painel_barbeiros();

-- Trigger: sync employee user_id to staff.staff_id
CREATE OR REPLACE FUNCTION public.sync_employee_to_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'barber' AND NEW.user_id IS NOT NULL THEN
    UPDATE staff SET
      staff_id = NEW.user_id,
      name = NEW.name,
      email = NEW.email,
      phone = NEW.phone,
      image_url = COALESCE(NEW.photo_url, image_url),
      is_active = COALESCE(NEW.is_active, true),
      commission_rate = NEW.commission_rate,
      updated_at = now()
    WHERE email = NEW.email AND (staff_id IS NULL OR staff_id != NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_employee_to_staff ON employees;
CREATE TRIGGER trigger_sync_employee_to_staff
  AFTER INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_to_staff();

-- Fix Raissa: set staff_id on staff table
UPDATE staff 
SET staff_id = '60d68366-b0e7-43c3-96ba-0b7e5290d0af'
WHERE email = 'raissarosiepv@icloud.com' AND staff_id IS NULL;

-- Create Raissa in painel_barbeiros
INSERT INTO painel_barbeiros (nome, email, telefone, image_url, foto_url, commission_rate, is_active, ativo, role, staff_id)
SELECT 
  e.name, e.email, e.phone, e.photo_url, e.photo_url, 
  e.commission_rate, true, true, 'barber', e.user_id
FROM employees e
WHERE e.email = 'raissarosiepv@icloud.com'
  AND NOT EXISTS (SELECT 1 FROM painel_barbeiros pb WHERE pb.email = e.email);
