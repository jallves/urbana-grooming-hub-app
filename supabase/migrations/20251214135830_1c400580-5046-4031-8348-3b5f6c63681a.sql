-- Adicionar coluna email na tabela client_profiles
ALTER TABLE public.client_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Criar índice para buscas por email
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON public.client_profiles(email);

-- Comentário explicativo
COMMENT ON COLUMN public.client_profiles.email IS 'Email opcional do cliente para envio de comprovantes';