import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGalleryImages = () => {
  const [images, setImages] = useState<Array<{id: number, src: string, alt: string}>>([]);
  const [loading, setLoading] = useState(true);

  const loadImages = async () => {
    try {
      setLoading(true);
      
      // Use gallery_images table which exists
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erro ao carregar galeria:', error);
        setImages([]);
        return;
      }

      const formattedImages = data?.map((photo, index) => ({
        id: index + 1,
        src: photo.src,
        alt: photo.alt || 'Imagem da galeria'
      })) || [];
      
      setImages(formattedImages);
    } catch (error) {
      console.error('Erro ao carregar galeria:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  return { images, loading, reloadImages: loadImages };
};