-- ============================================
-- LIMPEZA COMPLETA DE POLÍTICAS DUPLICADAS
-- ============================================

-- BANNER_IMAGES: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Allow authenticated users to modify banners" ON public.banner_images;
DROP POLICY IF EXISTS "Allow public read access for banners" ON public.banner_images;
DROP POLICY IF EXISTS "Anyone can delete banners" ON public.banner_images;
DROP POLICY IF EXISTS "Anyone can insert banners" ON public.banner_images;
DROP POLICY IF EXISTS "Anyone can update banners" ON public.banner_images;
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banner_images;
DROP POLICY IF EXISTS "Anyone can view banners" ON public.banner_images;
DROP POLICY IF EXISTS "Masters and admins can manage banners" ON public.banner_images;
DROP POLICY IF EXISTS "Permitir leitura pública de banners ativos" ON public.banner_images;
DROP POLICY IF EXISTS "Public can view active banners" ON public.banner_images;
DROP POLICY IF EXISTS "Public can view all banners" ON public.banner_images;
DROP POLICY IF EXISTS "banner_images_public_read" ON public.banner_images;

-- GALLERY_IMAGES: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow authenticated users to modify gallery" ON public.gallery_images;
DROP POLICY IF EXISTS "Anyone can view active gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Masters and admins can manage gallery" ON public.gallery_images;
DROP POLICY IF EXISTS "Public can view active gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "Public can view all gallery images" ON public.gallery_images;
DROP POLICY IF EXISTS "gallery_images_public_read" ON public.gallery_images;

-- GALLERY_PHOTOS: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admins podem gerenciar todas as fotos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Fotos publicadas são visíveis publicamente" ON public.gallery_photos;
DROP POLICY IF EXISTS "Masters and admins can manage photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Permitir leitura pública de fotos publicadas" ON public.gallery_photos;
DROP POLICY IF EXISTS "Public can view all gallery photos" ON public.gallery_photos;

-- ============================================
-- CRIAR POLÍTICAS LIMPAS E SIMPLES
-- ============================================

-- BANNER_IMAGES
-- 1. Todos podem ver TODOS os banners (sem filtro)
CREATE POLICY "public_select_all_banners"
ON public.banner_images
FOR SELECT
TO public
USING (true);

-- 2. Masters e admins podem gerenciar
CREATE POLICY "masters_admins_manage_banners"
ON public.banner_images
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- GALLERY_IMAGES
-- 1. Todos podem ver TODAS as imagens (sem filtro)
CREATE POLICY "public_select_all_gallery_images"
ON public.gallery_images
FOR SELECT
TO public
USING (true);

-- 2. Masters e admins podem gerenciar
CREATE POLICY "masters_admins_manage_gallery_images"
ON public.gallery_images
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- GALLERY_PHOTOS
-- 1. Todos podem ver TODAS as fotos (sem filtro)
CREATE POLICY "public_select_all_gallery_photos"
ON public.gallery_photos
FOR SELECT
TO public
USING (true);

-- 2. Masters e admins podem gerenciar
CREATE POLICY "masters_admins_manage_gallery_photos"
ON public.gallery_photos
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);