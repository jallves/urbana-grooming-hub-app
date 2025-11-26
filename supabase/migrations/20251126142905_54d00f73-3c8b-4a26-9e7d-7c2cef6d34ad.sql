-- Enable RLS on banner_images
ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to active banners
CREATE POLICY "Anyone can view active banners"
ON public.banner_images
FOR SELECT
USING (is_active = true);

-- Enable RLS on gallery_images
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to active gallery images
CREATE POLICY "Anyone can view active gallery images"
ON public.gallery_images
FOR SELECT
USING (is_active = true);

-- Enable realtime for banner_images
ALTER TABLE public.banner_images REPLICA IDENTITY FULL;

-- Enable realtime for gallery_images
ALTER TABLE public.gallery_images REPLICA IDENTITY FULL;