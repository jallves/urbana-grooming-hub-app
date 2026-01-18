-- Tabela para gerenciamento de banners rotativos
CREATE TABLE IF NOT EXISTS public.banner_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  button_text TEXT DEFAULT 'Agendar Agora',
  button_link TEXT DEFAULT '/painel-cliente/login',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública para exibição no frontend
CREATE POLICY "anyone_can_view_active_banners"
  ON public.banner_images
  FOR SELECT
  TO public
  USING (is_active = true);

-- Permitir gerenciamento completo para usuários autenticados (admin)
CREATE POLICY "authenticated_users_manage_banners"
  ON public.banner_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_banner_images_display_order 
  ON public.banner_images(display_order);

-- Índice para filtro de ativos
CREATE INDEX IF NOT EXISTS idx_banner_images_is_active 
  ON public.banner_images(is_active);

-- Comentários para documentação
COMMENT ON TABLE public.banner_images IS 'Tabela para gerenciamento de banners rotativos da home';
COMMENT ON COLUMN public.banner_images.image_url IS 'URL da imagem do banner';
COMMENT ON COLUMN public.banner_images.title IS 'Título principal do banner';
COMMENT ON COLUMN public.banner_images.subtitle IS 'Subtítulo do banner';
COMMENT ON COLUMN public.banner_images.button_text IS 'Texto do botão CTA';
COMMENT ON COLUMN public.banner_images.button_link IS 'Link do botão CTA';
COMMENT ON COLUMN public.banner_images.display_order IS 'Ordem de exibição do banner';