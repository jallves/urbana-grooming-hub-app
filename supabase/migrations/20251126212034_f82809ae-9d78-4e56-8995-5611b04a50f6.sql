-- Garantir que qualquer usuário possa ver os banners ativos
-- (não apenas usuários autenticados)

-- Remover política existente se houver
DROP POLICY IF EXISTS "anyone_can_view_banners" ON public.banner_images;
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banner_images;
DROP POLICY IF EXISTS "Public can view banners" ON public.banner_images;

-- Criar política para acesso público (anônimo E autenticado)
CREATE POLICY "Public can view active banners"
ON public.banner_images
FOR SELECT
TO anon, authenticated
USING (is_active = true);

COMMENT ON POLICY "Public can view active banners" ON public.banner_images IS 'Permite que qualquer usuário (autenticado ou não) veja banners ativos';