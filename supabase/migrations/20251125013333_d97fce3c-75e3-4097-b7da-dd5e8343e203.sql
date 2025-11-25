-- Criar view de compatibilidade painel_clientes usando client_profiles e auth.users

-- Primeiro, renomear a tabela antiga painel_clientes para painel_clientes_legacy
ALTER TABLE IF EXISTS painel_clientes RENAME TO painel_clientes_legacy;

-- Criar uma view painel_clientes que une client_profiles com auth.users
CREATE OR REPLACE VIEW painel_clientes AS
SELECT 
  cp.id,
  cp.nome,
  au.email,
  cp.whatsapp,
  cp.data_nascimento,
  cp.created_at,
  cp.updated_at
FROM client_profiles cp
LEFT JOIN auth.users au ON au.id = cp.id;

-- Adicionar comentário explicativo
COMMENT ON VIEW painel_clientes IS 'View de compatibilidade que mapeia client_profiles + auth.users para o formato esperado pelas queries existentes';