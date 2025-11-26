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
      console.log('🖼️ [useGallery] Iniciando busca...');
      setLoading(true);
      setError(null);
      
      // Timeout de 5 segundos para evitar travamento
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao buscar galeria')), 5000)
      );
      
      const queryPromise = supabase
        .from('gallery_images')
        .select('id, src, alt')
        .order('display_order', { ascending: true });

      const { data, error: fetchError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (fetchError) {
        console.error('❌ [useGallery] Erro:', fetchError.message);
        setError(fetchError.message);
        setImages(DEFAULT_IMAGES);
        return;
      }

      console.log('✅ [useGallery] Carregadas:', data?.length || 0);

      if (data && data.length > 0) {
        const mappedImages = data.map((item, index) => ({
          id: index + 1,
          src: item.src,
          alt: item.alt
        }));
        setImages(mappedImages);
      } else {
        setImages(DEFAULT_IMAGES);
      }
    } catch (err) {
      console.error('❌ [useGallery] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
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
