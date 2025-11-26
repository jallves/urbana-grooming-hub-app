import { useState, useEffect, useRef } from 'react';
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
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchImages = async () => {
    // Evita fetches duplicados simultâneos
    if (fetchingRef.current) {
      console.log('🎯 [useGallery] Fetch já em andamento, ignorando...');
      return;
    }

    fetchingRef.current = true;
    console.log('🚀 [useGallery] Iniciando fetch...');
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('gallery_images')
        .select('id, src, alt')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!mountedRef.current) return;
      
      console.log('📦 [useGallery] Resposta:', { count: data?.length || 0 });

      if (fetchError) {
        console.error('[useGallery] Erro:', fetchError);
        setError(fetchError.message);
        setImages(DEFAULT_IMAGES);
      } else if (data && data.length > 0) {
        console.log('[useGallery] ✅', data.length, 'imagens carregadas');
        const formattedData = data.map((item, index) => ({
          id: index + 1,
          src: item.src,
          alt: item.alt
        }));
        setImages(formattedData);
      } else {
        setImages(DEFAULT_IMAGES);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error('[useGallery] Exceção:', err);
      setError(err.message);
      setImages(DEFAULT_IMAGES);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchImages();

    const channel = supabase
      .channel('gallery_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery_images' },
        () => fetchImages()
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { images, loading, error, refetch: fetchImages };
};
