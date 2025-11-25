-- Sincronizar IDs de clientes - desabilitando apenas triggers USER

-- 1. Desabilitar triggers USER em painel_agendamentos temporariamente
ALTER TABLE painel_agendamentos DISABLE TRIGGER USER;

-- 2. Remover a constraint antiga PRIMEIRO
ALTER TABLE painel_agendamentos 
DROP CONSTRAINT IF EXISTS painel_agendamentos_cliente_id_fkey;

-- 3. Atualizar agendamentos para usar o ID correto de auth.users
DO $$
DECLARE
  cliente RECORD;
  auth_user_id UUID;
BEGIN
  FOR cliente IN 
    SELECT DISTINCT
      pc.id as old_id,
      pc.nome,
      pc.email,
      pc.whatsapp,
      pc.data_nascimento,
      pc.created_at
    FROM painel_clientes pc
    INNER JOIN painel_agendamentos pa ON pa.cliente_id = pc.id
    LEFT JOIN client_profiles cp ON cp.id = pc.id
    WHERE cp.id IS NULL
  LOOP
    -- Verificar se o usuário já existe em auth.users com esse email
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = cliente.email;

    IF auth_user_id IS NOT NULL THEN
      -- Usuário já existe em auth.users, atualizar os agendamentos
      UPDATE painel_agendamentos
      SET cliente_id = auth_user_id
      WHERE cliente_id = cliente.old_id;
      
      -- Criar ou atualizar o perfil
      INSERT INTO client_profiles (id, nome, whatsapp, data_nascimento, created_at, updated_at)
      VALUES (
        auth_user_id,
        cliente.nome,
        cliente.whatsapp,
        cliente.data_nascimento,
        COALESCE(cliente.created_at, now()),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        whatsapp = EXCLUDED.whatsapp,
        data_nascimento = EXCLUDED.data_nascimento,
        updated_at = now();
      
    ELSE
      -- Usuário não existe, criar em auth.users com o ID antigo
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
      ) VALUES (
        cliente.old_id,
        '00000000-0000-0000-0000-000000000000',
        cliente.email,
        crypt('SenhaTemporaria123!', gen_salt('bf')),
        now(),
        COALESCE(cliente.created_at, now()),
        now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object(
          'user_type', 'client',
          'nome', cliente.nome,
          'whatsapp', cliente.whatsapp,
          'data_nascimento', cliente.data_nascimento
        ),
        'authenticated',
        'authenticated'
      );
      
      -- Criar o perfil
      INSERT INTO client_profiles (id, nome, whatsapp, data_nascimento, created_at, updated_at)
      VALUES (
        cliente.old_id,
        cliente.nome,
        cliente.whatsapp,
        cliente.data_nascimento,
        COALESCE(cliente.created_at, now()),
        now()
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;

  END LOOP;
END $$;

-- 4. Reabilitar triggers USER
ALTER TABLE painel_agendamentos ENABLE TRIGGER USER;

-- 5. Adicionar nova constraint apontando para client_profiles
ALTER TABLE painel_agendamentos 
ADD CONSTRAINT painel_agendamentos_cliente_id_fkey 
FOREIGN KEY (cliente_id) 
REFERENCES client_profiles(id) 
ON DELETE CASCADE;