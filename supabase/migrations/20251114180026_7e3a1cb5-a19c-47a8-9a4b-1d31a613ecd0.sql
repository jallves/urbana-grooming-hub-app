-- Criar bucket de produtos se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket products
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Admins podem fazer upload de imagens de produtos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins podem atualizar imagens de produtos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins podem deletar imagens de produtos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);