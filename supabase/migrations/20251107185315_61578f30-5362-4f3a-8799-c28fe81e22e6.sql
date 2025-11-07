-- ============================================
-- MIGRAÇÃO AUTOMÁTICA: FUNCIONÁRIOS → BARBEIROS
-- ============================================
-- Este script cria triggers para sincronizar automaticamente
-- funcionários com role='barber' da tabela staff para painel_barbeiros

-- 1. FUNÇÃO: Sincronizar funcionário barbeiro → painel_barbeiros
CREATE OR REPLACE FUNCTION public.sync_staff_to_barber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
      
    RAISE NOTICE 'Barbeiro sincronizado: % (ID: %)', NEW.name, NEW.id;
    
  ELSE
    -- Se o role mudou de 'barber' para outro, remover de painel_barbeiros
    IF OLD.role = 'barber' AND NEW.role != 'barber' THEN
      DELETE FROM public.painel_barbeiros WHERE staff_id = NEW.id;
      RAISE NOTICE 'Barbeiro removido de painel_barbeiros: % (ID: %)', NEW.name, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. TRIGGER: Ao inserir funcionário
DROP TRIGGER IF EXISTS trigger_sync_staff_insert ON public.staff;
CREATE TRIGGER trigger_sync_staff_insert
  AFTER INSERT ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_staff_to_barber();

-- 3. TRIGGER: Ao atualizar funcionário
DROP TRIGGER IF EXISTS trigger_sync_staff_update ON public.staff;
CREATE TRIGGER trigger_sync_staff_update
  AFTER UPDATE ON public.staff
  FOR EACH ROW
  WHEN (
    OLD.role IS DISTINCT FROM NEW.role OR
    OLD.name IS DISTINCT FROM NEW.name OR
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.commission_rate IS DISTINCT FROM NEW.commission_rate OR
    OLD.is_active IS DISTINCT FROM NEW.is_active OR
    OLD.image_url IS DISTINCT FROM NEW.image_url OR
    OLD.specialties IS DISTINCT FROM NEW.specialties OR
    OLD.experience IS DISTINCT FROM NEW.experience
  )
  EXECUTE FUNCTION public.sync_staff_to_barber();

-- 4. ADICIONAR CONSTRAINT UNIQUE em painel_barbeiros.staff_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'painel_barbeiros_staff_id_key'
  ) THEN
    ALTER TABLE public.painel_barbeiros 
    ADD CONSTRAINT painel_barbeiros_staff_id_key UNIQUE (staff_id);
  END IF;
END $$;

-- 5. MIGRAÇÃO INICIAL: Sincronizar barbeiros existentes
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
)
SELECT 
  s.name,
  s.email,
  s.phone,
  s.image_url,
  s.specialties,
  s.experience,
  s.commission_rate,
  s.is_active,
  'barber',
  s.id,
  s.created_at,
  NOW()
FROM public.staff s
WHERE s.role = 'barber'
  AND s.id NOT IN (
    SELECT staff_id 
    FROM public.painel_barbeiros 
    WHERE staff_id IS NOT NULL
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

-- 6. CRIAR ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_painel_barbeiros_staff_id 
  ON public.painel_barbeiros(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_role_active 
  ON public.staff(role, is_active);

-- ============================================
-- VERIFICAÇÃO DO SISTEMA
-- ============================================

-- Comentários explicativos
COMMENT ON FUNCTION public.sync_staff_to_barber() IS 
'Sincroniza automaticamente funcionários com role=barber da tabela staff para painel_barbeiros';

COMMENT ON TRIGGER trigger_sync_staff_insert ON public.staff IS 
'Trigger automático: cria registro em painel_barbeiros quando funcionário com role=barber é criado';

COMMENT ON TRIGGER trigger_sync_staff_update ON public.staff IS 
'Trigger automático: atualiza painel_barbeiros quando funcionário barbeiro é atualizado';
