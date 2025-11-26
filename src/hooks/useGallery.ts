import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GalleryImage } from '@/types/settings';

const DEFAULT_IMAGES: GalleryImage[] = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
    alt: 'Barbeiro trabalhando com precisão',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=800',
    alt: 'Interior moderno da barbearia',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800',
    alt: 'Equipamentos profissionais',
  },
];

export const useGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>(DEFAULT_IMAGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = async () => {
    try {
      console.log('🖼️ [useGallery] Buscando galeria...');
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('gallery_images')
        .select('id, src, alt')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('❌ [useGallery] Erro:', fetchError);
        setError(fetchError.message);
        setImages(DEFAULT_IMAGES);
        return;
      }

      console.log('✅ [useGallery] Sucesso:', data?.length || 0, 'imagens');

      if (data && data.length > 0) {
        const mappedImages = data.map((item, index) => ({
          id: index + 1,
          src: item.src,
          alt: item.alt
        }));
        setImages(mappedImages);
      } else {
        console.log('⚠️ [useGallery] Nenhuma imagem ativa, usando defaults');
        setImages(DEFAULT_IMAGES);
      }
    } catch (err) {
      console.error('❌ [useGallery] Exceção:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setImages(DEFAULT_IMAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  return { 
    images, 
    loading, 
    error, 
    refetch: fetchGallery 
  };
};
