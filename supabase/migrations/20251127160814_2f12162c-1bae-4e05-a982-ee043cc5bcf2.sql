-- Corrigir foreign key da tabela vendas
-- Problema: vendas.cliente_id aponta para painel_clientes_legacy (vazia)
-- Solução: Apontar para client_profiles (tabela real que painel_clientes view usa)

-- 1. Remover constraint antiga
ALTER TABLE vendas 
DROP CONSTRAINT IF EXISTS vendas_cliente_id_fkey;

-- 2. Criar constraint correta apontando para client_profiles
ALTER TABLE vendas 
ADD CONSTRAINT vendas_cliente_id_fkey 
FOREIGN KEY (cliente_id) 
REFERENCES client_profiles(id) 
ON DELETE SET NULL;

-- Comentário explicativo
COMMENT ON CONSTRAINT vendas_cliente_id_fkey ON vendas IS 
'Foreign key para client_profiles (tabela real de clientes usada pela view painel_clientes)';
