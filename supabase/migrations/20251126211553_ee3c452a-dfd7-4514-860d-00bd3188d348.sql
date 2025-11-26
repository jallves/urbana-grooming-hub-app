-- ============================================
-- PARTE 2: TRIGGERS E SINCRONIZAÇÃO AUTOMÁTICA
-- ============================================

-- 1. Função para sincronizar role de cliente automaticamente
CREATE OR REPLACE FUNCTION public.sync_client_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir role 'client' para o usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. Trigger para sincronizar role quando client_profile é criado
DROP TRIGGER IF EXISTS on_client_profile_created ON public.client_profiles;
CREATE TRIGGER on_client_profile_created
  AFTER INSERT ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_client_role();

-- 3. Função para sincronizar role de barbeiro automaticamente
CREATE OR REPLACE FUNCTION public.sync_barber_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar user_id do staff pelo staff_id
  SELECT user_id INTO v_user_id
  FROM public.staff
  WHERE id = NEW.staff_id;
  
  -- Se encontrou user_id, criar role de barbeiro
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'barber'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Trigger para sincronizar role quando barber é criado em barbers_2
DROP TRIGGER IF EXISTS on_barber_created ON public.barbers_2;
CREATE TRIGGER on_barber_created
  AFTER INSERT ON public.barbers_2
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_barber_role();

-- 5. Sincronizar roles existentes de clientes
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'::app_role
FROM public.client_profiles
WHERE id IN (SELECT id FROM auth.users)
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Sincronizar roles existentes de barbeiros
INSERT INTO public.user_roles (user_id, role)
SELECT s.user_id, 'barber'::app_role
FROM public.staff s
INNER JOIN public.barbers_2 b ON b.staff_id = s.id
WHERE s.user_id IS NOT NULL 
  AND s.is_active = true
  AND s.role = 'barber'
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Atualizar políticas RLS para user_roles incluir clientes
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 8. Comentários explicativos
COMMENT ON FUNCTION public.sync_client_role() IS 'Automaticamente cria role client quando client_profile é criado';
COMMENT ON FUNCTION public.sync_barber_role() IS 'Automaticamente cria role barber quando registro em barbers_2 é criado';
COMMENT ON TRIGGER on_client_profile_created ON public.client_profiles IS 'Sincroniza role de cliente automaticamente';
COMMENT ON TRIGGER on_barber_created ON public.barbers_2 IS 'Sincroniza role de barbeiro automaticamente';