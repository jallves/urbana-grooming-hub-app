-- Garantir que pgcrypto está instalada e acessível
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Verificar se a função está disponível
DO $$
DECLARE
  test_bytes bytea;
BEGIN
  -- Testar a função diretamente
  test_bytes := extensions.gen_random_bytes(16);
  RAISE NOTICE 'gen_random_bytes está funcionando: %', encode(test_bytes, 'hex');
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erro ao testar gen_random_bytes: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- Garantir que o schema extensions está no search_path do auth
ALTER DATABASE postgres SET search_path TO "$user", public, extensions;

-- Comentário explicativo
COMMENT ON EXTENSION pgcrypto IS 'Extensão necessária para o Supabase Auth gerar tokens seguros';