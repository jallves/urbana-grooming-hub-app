-- Permitir que usuários autenticados possam inserir logs de atividade
-- (a função log_admin_activity já é SECURITY DEFINER, mas precisamos garantir que funcione)

-- Adicionar política para permitir insert de logs por usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.admin_activity_log;

CREATE POLICY "Authenticated users can insert logs"
ON public.admin_activity_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Garantir que a função log_admin_activity funcione corretamente
-- mesmo quando não há admin_user vinculado
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_log_id UUID;
  v_user_email TEXT;
BEGIN
  -- Buscar admin_id pelo auth.uid()
  SELECT id INTO v_admin_id
  FROM public.admin_users
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Se não encontrou admin_user, buscar email do auth.users para referência
  IF v_admin_id IS NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
  END IF;

  -- Inserir log (admin_id pode ser NULL se usuário não for admin registrado)
  INSERT INTO public.admin_activity_log (
    admin_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) VALUES (
    v_admin_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    CASE 
      WHEN v_admin_id IS NULL AND p_new_data IS NOT NULL 
      THEN p_new_data || jsonb_build_object('_user_email', v_user_email)
      ELSE p_new_data
    END
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;