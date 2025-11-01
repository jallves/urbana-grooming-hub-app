-- Criar tabela para autenticação do totem
CREATE TABLE IF NOT EXISTS public.totem_auth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.totem_auth ENABLE ROW LEVEL SECURITY;

-- Políticas para totem_auth (apenas leitura pública para autenticação)
CREATE POLICY "Permitir leitura de dispositivos ativos"
ON public.totem_auth
FOR SELECT
USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_totem_auth_updated_at
BEFORE UPDATE ON public.totem_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_totem_updated_at();

-- Inserir um PIN padrão para testes (PIN: 1234, hash gerado)
INSERT INTO public.totem_auth (device_name, pin_hash)
VALUES ('Totem Principal', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4')
ON CONFLICT DO NOTHING;

-- Comentário: O PIN padrão é 1234 (hash SHA-256)
COMMENT ON TABLE public.totem_auth IS 'Tabela de autenticação para dispositivos totem. PIN padrão: 1234';