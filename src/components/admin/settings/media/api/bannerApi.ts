
import { supabase } from '@/integrations/supabase/client';
import { BannerImage } from '@/types/settings';

export const fetchBannerImages = async () => {
  const { data, error } = await supabase
    .from('banner_images')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  
  if (data) {
    return data.map(item => ({
      id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
      imageUrl: item.image_url,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description || ''
    }));
  }
  
  return [];
};

export const createBanner = async (newBanner: {
  image_url: string;
  title: string;
  subtitle: string;
  description: string;
  display_order: number;
}) => {
  const { data, error } = await supabase
    .from('banner_images')
    .insert({
      image_url: newBanner.image_url,
      title: newBanner.title,
      subtitle: newBanner.subtitle,
      description: newBanner.description,
      display_order: newBanner.display_order,
      is_active: true
    })
    .select();
  
  if (error) throw error;
  return data;
};

export const updateBanner = async (banner: {
  image_url: string;
  title: string;
  subtitle: string;
  description: string;
}) => {
  const { data, error } = await supabase
    .from('banner_images')
    .update({
      image_url: banner.image_url,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description
    })
    .eq('image_url', banner.image_url)
    .select();
  
  if (error) throw error;
  return data;
};

export const deleteBanner = async (imageUrl: string) => {
  const { error } = await supabase
    .from('banner_images')
    .delete()
    .eq('image_url', imageUrl);
  
  if (error) throw error;
};
