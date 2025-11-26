-- =====================================================================
-- SOLUÇÃO DEFINITIVA: Sistema de Perfis de Cliente Automático
-- =====================================================================

-- 1. Garantir que client_profiles permite whatsapp temporário
ALTER TABLE client_profiles DROP CONSTRAINT IF EXISTS client_profiles_whatsapp_unique;
CREATE UNIQUE INDEX IF NOT EXISTS client_profiles_whatsapp_unique 
  ON client_profiles(whatsapp) 
  WHERE whatsapp NOT LIKE 'temp-%';

-- 2. Função melhorada para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome TEXT;
  v_whatsapp TEXT;
  v_data_nascimento DATE;
BEGIN
  -- Extrair dados dos metadados
  v_nome := COALESCE(
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    'Usuário'
  );
  
  v_whatsapp := COALESCE(
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'phone',
    'temp-' || NEW.id::text
  );
  
  v_data_nascimento := COALESCE(
    (NEW.raw_user_meta_data->>'data_nascimento')::date,
    NULL
  );

  -- Inserir perfil (ignorar se já existe)
  INSERT INTO public.client_profiles (id, nome, whatsapp, data_nascimento)
  VALUES (NEW.id, v_nome, v_whatsapp, v_data_nascimento)
  ON CONFLICT (id) DO UPDATE
  SET 
    nome = COALESCE(EXCLUDED.nome, client_profiles.nome),
    whatsapp = CASE 
      WHEN client_profiles.whatsapp LIKE 'temp-%' THEN EXCLUDED.whatsapp
      ELSE client_profiles.whatsapp
    END,
    data_nascimento = COALESCE(EXCLUDED.data_nascimento, client_profiles.data_nascimento),
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log mas não falhar (para não bloquear signUp)
  RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- 4. Política RLS para client_profiles (permitir leitura do próprio perfil)
DROP POLICY IF EXISTS "Clientes podem ver próprio perfil" ON client_profiles;
CREATE POLICY "Clientes podem ver próprio perfil"
  ON client_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Clientes podem atualizar próprio perfil" ON client_profiles;
CREATE POLICY "Clientes podem atualizar próprio perfil"
  ON client_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Migração retroativa: Criar perfis para usuários sem perfil (tratando conflitos)
DO $$
DECLARE
  v_user_record RECORD;
  v_nome TEXT;
  v_whatsapp TEXT;
BEGIN
  FOR v_user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN client_profiles cp ON au.id = cp.id
    WHERE cp.id IS NULL
      AND au.id NOT IN (SELECT user_id FROM user_roles WHERE user_id IS NOT NULL)
  LOOP
    BEGIN
      -- Extrair nome
      v_nome := COALESCE(
        v_user_record.raw_user_meta_data->>'nome',
        v_user_record.raw_user_meta_data->>'name', 
        v_user_record.email,
        'Usuário'
      );
      
      -- Sempre usar whatsapp temporário para evitar conflitos
      v_whatsapp := 'temp-' || v_user_record.id::text;
      
      -- Inserir perfil
      INSERT INTO client_profiles (id, nome, whatsapp)
      VALUES (v_user_record.id, v_nome, v_whatsapp)
      ON CONFLICT (id) DO NOTHING;
      
      RAISE NOTICE 'Perfil criado para usuário: % (email: %)', v_user_record.id, v_user_record.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Não foi possível criar perfil para %: %', v_user_record.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- 6. Comentários
COMMENT ON FUNCTION public.handle_new_user_profile() IS 
  'Cria automaticamente perfil em client_profiles quando usuário é criado. Nunca falha para não bloquear signUp.';
COMMENT ON COLUMN client_profiles.whatsapp IS 
  'WhatsApp do cliente. Valores temp-* são temporários e podem ser atualizados posteriormente.';