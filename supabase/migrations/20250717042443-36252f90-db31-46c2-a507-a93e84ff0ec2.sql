
-- Sincronizar barbeiros da tabela staff com employees
INSERT INTO public.employees (
  name,
  email,
  phone,
  role,
  status,
  photo_url,
  created_at,
  updated_at
)
SELECT 
  s.name,
  s.email,
  s.phone,
  'barber' as role,
  CASE WHEN s.is_active THEN 'active' ELSE 'inactive' END as status,
  s.image_url as photo_url,
  s.created_at,
  s.updated_at
FROM public.staff s
WHERE s.role = 'barber'
  AND s.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.email = s.email
  );

-- Criar trigger para manter sincronização automática
CREATE OR REPLACE FUNCTION sync_barber_to_employee()
RETURNS TRIGGER AS $$
BEGIN
  -- Para inserção ou atualização de barbeiros
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Se é um barbeiro e tem email
    IF NEW.role = 'barber' AND NEW.email IS NOT NULL THEN
      INSERT INTO public.employees (
        name,
        email,
        phone,
        role,
        status,
        photo_url,
        created_at,
        updated_at
      ) VALUES (
        NEW.name,
        NEW.email,
        NEW.phone,
        'barber',
        CASE WHEN NEW.is_active THEN 'active' ELSE 'inactive' END,
        NEW.image_url,
        NEW.created_at,
        NEW.updated_at
      )
      ON CONFLICT (email) 
      DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        status = EXCLUDED.status,
        photo_url = EXCLUDED.photo_url,
        updated_at = EXCLUDED.updated_at;
    END IF;
    RETURN NEW;
  END IF;

  -- Para deleção
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.employees 
    WHERE email = OLD.email AND role = 'barber';
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER sync_staff_to_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION sync_barber_to_employee();
