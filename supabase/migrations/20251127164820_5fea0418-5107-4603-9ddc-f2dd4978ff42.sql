-- Corrigir foreign key da tabela appointment_ratings
-- O problema é que está apontando para painel_clientes_legacy (que não tem dados)
-- Deve apontar para client_profiles (tabela real de clientes)

-- Remover constraint antiga
ALTER TABLE appointment_ratings 
DROP CONSTRAINT IF EXISTS appointment_ratings_client_id_fkey;

-- Adicionar constraint correta apontando para client_profiles
ALTER TABLE appointment_ratings 
ADD CONSTRAINT appointment_ratings_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES client_profiles(id) 
ON DELETE CASCADE;