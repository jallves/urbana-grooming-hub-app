-- Criar índice para otimizar a consulta de roles por user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Adicionar comentário explicativo
COMMENT ON INDEX idx_user_roles_user_id IS 'Índice para otimizar consultas de roles por user_id no AuthContext';