-- Remover a extensão do schema extensions
DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- Instalar no schema public (padrão esperado pelo Supabase Auth)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

-- Verificar se a função está acessível
DO $$
DECLARE
  test_bytes bytea;
BEGIN
  -- Testar a função no schema public
  test_bytes := public.gen_random_bytes(16);
  RAISE NOTICE '✅ gen_random_bytes funcionando no public: %', encode(test_bytes, 'hex');
  
  -- Testar sem qualificador de schema (como o Auth faz)
  test_bytes := gen_random_bytes(16);
  RAISE NOTICE '✅ gen_random_bytes acessível sem schema: %', encode(test_bytes, 'hex');
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '❌ Erro: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- Restaurar search_path padrão
ALTER DATABASE postgres SET search_path TO "$user", public;