-- Remover trigger e função na ordem correta
-- Primeiro remove o trigger, depois a função

DROP TRIGGER IF EXISTS on_auth_client_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_client_user() CASCADE;

-- Comentário: Removemos o trigger automático que estava causando erro 500
-- A criação do perfil será feita manualmente no código com melhor tratamento de erros