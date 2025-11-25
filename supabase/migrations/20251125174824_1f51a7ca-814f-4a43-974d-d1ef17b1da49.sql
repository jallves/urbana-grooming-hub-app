-- Adicionar constraint única para o campo whatsapp na tabela clients
-- Primeiro, verificar se há duplicatas e removê-las (mantendo o mais antigo)
DO $$ 
BEGIN
  -- Se houver duplicatas, mantém apenas o registro mais antigo
  DELETE FROM public.clients a
  USING public.clients b
  WHERE a.id > b.id
    AND a.whatsapp = b.whatsapp
    AND a.whatsapp IS NOT NULL
    AND a.whatsapp != '';
END $$;

-- Adicionar constraint única para whatsapp
ALTER TABLE public.clients
ADD CONSTRAINT clients_whatsapp_unique UNIQUE (whatsapp);

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON public.clients(whatsapp) WHERE whatsapp IS NOT NULL;

-- Adicionar constraint única para whatsapp na tabela client_profiles também
ALTER TABLE public.client_profiles
ADD CONSTRAINT client_profiles_whatsapp_unique UNIQUE (whatsapp);

-- Criar índice para melhor performance nas buscas em client_profiles
CREATE INDEX IF NOT EXISTS idx_client_profiles_whatsapp ON public.client_profiles(whatsapp) WHERE whatsapp IS NOT NULL;

-- Comentários para documentação
COMMENT ON CONSTRAINT clients_whatsapp_unique ON public.clients IS 'Garante que cada número de WhatsApp seja único no sistema';
COMMENT ON CONSTRAINT client_profiles_whatsapp_unique ON public.client_profiles IS 'Garante que cada número de WhatsApp seja único no sistema';