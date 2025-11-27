-- Corrigir foreign key de financial_records.client_id
-- O client_id no totem vem de painel_clientes (client_profiles), não de painel_clientes_legacy

-- 1. Remover constraint incorreta
ALTER TABLE financial_records 
DROP CONSTRAINT IF EXISTS financial_records_client_id_fkey;

-- 2. Adicionar constraint correta apontando para client_profiles
ALTER TABLE financial_records
ADD CONSTRAINT financial_records_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES client_profiles(id) 
ON DELETE CASCADE;

-- Log da correção
COMMENT ON CONSTRAINT financial_records_client_id_fkey ON financial_records IS 
'Corrigido para referenciar client_profiles ao invés de painel_clientes_legacy - integração totem/ERP';