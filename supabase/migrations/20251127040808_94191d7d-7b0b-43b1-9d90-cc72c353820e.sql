-- Corrige constraint user_sessions para permitir todos os tipos de usuários
-- Problema: master e manager não estavam permitidos, impedindo login desses usuários

-- Remove a constraint antiga
ALTER TABLE public.user_sessions 
DROP CONSTRAINT IF EXISTS user_sessions_user_type_check;

-- Adiciona a nova constraint com todos os tipos de usuário
ALTER TABLE public.user_sessions
ADD CONSTRAINT user_sessions_user_type_check 
CHECK (user_type IN ('admin', 'barber', 'client', 'painel_cliente', 'totem', 'master', 'manager'));