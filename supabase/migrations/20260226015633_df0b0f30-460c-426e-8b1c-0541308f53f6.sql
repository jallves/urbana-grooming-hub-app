
-- Create products storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true);

-- Allow public read
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated admins to manage product images
CREATE POLICY "Admins can manage product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);
