-- Adicionar políticas para permitir visualização pública de TODOS os banners e imagens da galeria
-- (sem filtro de is_active ou published)

-- Política para ver todos os banners (não apenas ativos)
DROP POLICY IF EXISTS "Public can view all banners" ON public.banner_images;
CREATE POLICY "Public can view all banners"
ON public.banner_images
FOR SELECT
TO public
USING (true);

-- Política para ver todas as imagens da galeria (não apenas ativas)
DROP POLICY IF EXISTS "Public can view all gallery images" ON public.gallery_images;
CREATE POLICY "Public can view all gallery images"
ON public.gallery_images
FOR SELECT
TO public
USING (true);

-- Política para ver todas as fotos da galeria (não apenas publicadas)
DROP POLICY IF EXISTS "Public can view all gallery photos" ON public.gallery_photos;
CREATE POLICY "Public can view all gallery photos"
ON public.gallery_photos
FOR SELECT
TO public
USING (true);