-- Políticas RLS para o bucket staff-photos
-- Permitir que admin e manager façam upload de fotos
CREATE POLICY "Admin e Manager podem fazer upload de fotos de funcionários"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff-photos' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Permitir que admin e manager atualizem fotos
CREATE POLICY "Admin e Manager podem atualizar fotos de funcionários"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff-photos' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Permitir que admin e manager deletem fotos
CREATE POLICY "Admin e Manager podem deletar fotos de funcionários"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff-photos' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Permitir que todos vejam as fotos (bucket público)
CREATE POLICY "Fotos de funcionários são públicas para visualização"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'staff-photos');