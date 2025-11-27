-- Habilitar extensão pgcrypto que contém gen_random_bytes
-- Esta função é necessária para o Supabase Auth funcionar corretamente
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verificar se a função está disponível
DO $$
BEGIN
  PERFORM gen_random_bytes(16);
  RAISE NOTICE 'gen_random_bytes está funcionando corretamente';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erro ao testar gen_random_bytes: %', SQLERRM;
END $$;

-- Limpar sessões fantasmas (forçar logout de todos)
UPDATE user_sessions 
SET is_active = false, 
    logout_at = NOW()
WHERE user_email = 'joao.colimoides@gmail.com' 
  AND is_active = true;

-- Adicionar notificação de logout forçado (forced_by pode ser NULL quando é uma ação do sistema)
INSERT INTO force_logout_notifications (user_id, user_email, reason, forced_by)
VALUES (
  'ee055e2c-1504-4c72-b3e5-fb4682f1b2db',
  'joao.colimoides@gmail.com',
  'Logout forçado devido a erro de autenticação - função gen_random_bytes faltando',
  NULL
);