-- Adicionar coluna email_verified na tabela painel_clientes
ALTER TABLE public.painel_clientes 
ADD COLUMN email_verified boolean NOT NULL DEFAULT false;

-- Clientes existentes já devem ter email verificado
UPDATE public.painel_clientes SET email_verified = true WHERE user_id IS NOT NULL;