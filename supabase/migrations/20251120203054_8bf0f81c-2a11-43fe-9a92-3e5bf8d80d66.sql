-- 🖼️ Criar bucket para fotos de funcionários/barbeiros
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-photos',
  'staff-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 🔓 Política: Qualquer pessoa pode VER as fotos (público)
CREATE POLICY "Fotos de staff são públicas para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff-photos');

-- 🔒 Política: Apenas usuários autenticados podem FAZER UPLOAD
CREATE POLICY "Usuários autenticados podem fazer upload de fotos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staff-photos' 
  AND auth.role() = 'authenticated'
);

-- 🔒 Política: Apenas usuários autenticados podem ATUALIZAR fotos
CREATE POLICY "Usuários autenticados podem atualizar fotos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'staff-photos' 
  AND auth.role() = 'authenticated'
);

-- 🔒 Política: Apenas usuários autenticados podem DELETAR fotos
CREATE POLICY "Usuários autenticados podem deletar fotos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'staff-photos' 
  AND auth.role() = 'authenticated'
);