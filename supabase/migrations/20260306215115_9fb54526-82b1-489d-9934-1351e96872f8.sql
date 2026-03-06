
-- Fix: sync_employee_to_staff should INSERT into staff if not exists
CREATE OR REPLACE FUNCTION public.sync_employee_to_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'barber' THEN
    -- Check if staff record exists by email
    IF EXISTS (SELECT 1 FROM staff WHERE email = NEW.email) THEN
      -- Update existing
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
      -- Insert new staff record
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
$$;

-- Now insert Thomas Jefferson into staff
INSERT INTO staff (name, email, phone, image_url, is_active, commission_rate, role, staff_id)
SELECT e.name, e.email, e.phone, e.photo_url, COALESCE(e.is_active, true), e.commission_rate, 'barber', e.user_id
FROM employees e
WHERE e.email = 'ursocara2@gmail.com'
AND NOT EXISTS (SELECT 1 FROM staff WHERE email = 'ursocara2@gmail.com');

-- Update painel_barbeiros to link staff_id correctly
UPDATE painel_barbeiros pb
SET staff_id = s.id
FROM staff s
WHERE s.email = pb.email
AND pb.email = 'ursocara2@gmail.com'
AND (pb.staff_id IS NULL OR pb.staff_id != s.id);
