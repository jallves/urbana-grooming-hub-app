-- Migrar e-mail do auth.users para client_profiles
-- Apenas para clientes com dados completos (whatsapp real e data de nascimento válida)
UPDATE client_profiles 
SET email = au.email
FROM auth.users au
WHERE client_profiles.id = au.id
  AND client_profiles.whatsapp NOT LIKE 'temp-%'
  AND client_profiles.data_nascimento IS NOT NULL
  AND client_profiles.data_nascimento < '2025-01-01';