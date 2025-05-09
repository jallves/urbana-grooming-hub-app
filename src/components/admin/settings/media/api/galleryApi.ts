
import { supabase } from '@/integrations/supabase/client';
import { GalleryImage } from '@/types/settings';

export const fetchGalleryImages = async () => {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  
  if (data) {
    const formattedData: GalleryImage[] = data.map(item => ({
      id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
      src: item.src,
      alt: item.alt
    }));
    return formattedData;
  }
  
  return [];
};

export const createGalleryImage = async (newImage: {
  src: string;
  alt: string;
  display_order: number;
}) => {
  const { data, error } = await supabase
    .from('gallery_images')
    .insert({
      src: newImage.src,
      alt: newImage.alt,
      display_order: newImage.display_order,
      is_active: true
    })
    .select();
  
  if (error) throw error;
  return data;
};

export const updateGalleryImage = async (image: {
  src: string;
  alt: string;
}) => {
  const { data, error } = await supabase
    .from('gallery_images')
    .update({
      src: image.src,
      alt: image.alt
    })
    .eq('src', image.src)
    .select();
  
  if (error) throw error;
  return data;
};

export const deleteGalleryImage = async (src: string) => {
  const { error } = await supabase
    .from('gallery_images')
    .delete()
    .eq('src', src);
  
  if (error) throw error;
};

export const updateGalleryImageOrder = async (src: string, displayOrder: number) => {
  const { error } = await supabase
    .from('gallery_images')
    .update({ display_order: displayOrder })
    .eq('src', src);
  
  if (error) throw error;
};
