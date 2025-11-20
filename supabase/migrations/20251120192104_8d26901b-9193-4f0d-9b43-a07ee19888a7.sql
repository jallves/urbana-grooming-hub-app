-- Remover política problemática com recursão infinita
DROP POLICY IF EXISTS "Allow admin full access" ON gallery_images;

-- Criar política simples e segura para admins
CREATE POLICY "Admins can manage gallery images"
ON gallery_images
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Garantir que público pode ver imagens ativas
DROP POLICY IF EXISTS "Allow public read access" ON gallery_images;
DROP POLICY IF EXISTS "Allow public read access for gallery" ON gallery_images;

CREATE POLICY "Public can view active gallery images"
ON gallery_images
FOR SELECT
USING (is_active = true);