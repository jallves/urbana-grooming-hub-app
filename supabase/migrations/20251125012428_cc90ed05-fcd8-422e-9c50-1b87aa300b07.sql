-- =====================================================
-- MIGRATION: Migração de painel_clientes para auth.users
-- Objetivo: Usar sistema de autenticação nativo do Supabase
-- =====================================================

-- 1. Criar tabela client_profiles para dados adicionais
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  data_nascimento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS na tabela client_profiles
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies para client_profiles
CREATE POLICY "Users can view own profile"
  ON public.client_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.client_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.client_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('master', 'admin', 'manager')
    )
  );

-- 4. Função para sincronizar novos usuários clientes
CREATE OR REPLACE FUNCTION public.handle_new_client_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir perfil apenas se o usuário tem metadados de cliente
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    INSERT INTO public.client_profiles (id, nome, whatsapp, data_nascimento)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', 'Cliente'),
      COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
      (NEW.raw_user_meta_data->>'data_nascimento')::DATE
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_client_user_created ON auth.users;
CREATE TRIGGER on_auth_client_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_client_user();

-- 6. Adicionar coluna auth_user_id em painel_clientes (temporária para migração)
ALTER TABLE public.painel_clientes 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 7. Função para migrar clientes existentes
CREATE OR REPLACE FUNCTION public.migrate_painel_clientes_to_auth()
RETURNS TABLE(
  migrated_count INTEGER,
  error_count INTEGER,
  errors JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente RECORD;
  v_auth_user_id UUID;
  v_migrated INTEGER := 0;
  v_errors INTEGER := 0;
  v_error_details JSONB := '[]'::JSONB;
  v_temp_password TEXT := 'TempPass123!';
BEGIN
  -- Loop por todos os clientes
  FOR v_cliente IN 
    SELECT * FROM public.painel_clientes 
    WHERE auth_user_id IS NULL
    ORDER BY created_at
  LOOP
    BEGIN
      -- Verificar se já existe usuário com este email
      SELECT id INTO v_auth_user_id
      FROM auth.users
      WHERE email = v_cliente.email;

      IF v_auth_user_id IS NULL THEN
        -- Criar novo usuário no auth.users
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_user_meta_data,
          created_at,
          updated_at,
          confirmation_token,
          recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          v_cliente.email,
          crypt(v_temp_password, gen_salt('bf')),
          NOW(), -- Email já confirmado
          jsonb_build_object(
            'user_type', 'client',
            'nome', v_cliente.nome,
            'whatsapp', v_cliente.whatsapp,
            'data_nascimento', v_cliente.data_nascimento,
            'requires_password_change', true
          ),
          v_cliente.created_at,
          NOW(),
          '',
          ''
        )
        RETURNING id INTO v_auth_user_id;

        -- Criar perfil
        INSERT INTO public.client_profiles (id, nome, whatsapp, data_nascimento, created_at)
        VALUES (
          v_auth_user_id,
          v_cliente.nome,
          v_cliente.whatsapp,
          v_cliente.data_nascimento,
          v_cliente.created_at
        );
      END IF;

      -- Atualizar painel_clientes com auth_user_id
      UPDATE public.painel_clientes
      SET auth_user_id = v_auth_user_id
      WHERE id = v_cliente.id;

      v_migrated := v_migrated + 1;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_error_details := v_error_details || jsonb_build_object(
        'cliente_id', v_cliente.id,
        'email', v_cliente.email,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN QUERY SELECT v_migrated, v_errors, v_error_details;
END;
$$;

-- 8. Executar migração
SELECT * FROM public.migrate_painel_clientes_to_auth();

-- 9. Trigger para atualizar updated_at em client_profiles
CREATE OR REPLACE FUNCTION public.update_client_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_client_profiles_timestamp ON public.client_profiles;
CREATE TRIGGER update_client_profiles_timestamp
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_profiles_updated_at();

-- 10. Comentários
COMMENT ON TABLE public.client_profiles IS 'Perfis de clientes - dados adicionais dos usuários auth.users';
COMMENT ON COLUMN public.painel_clientes.auth_user_id IS 'Referência ao usuário no auth.users (campo temporário para migração)';