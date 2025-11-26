import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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

const fetchGalleryImages = async (): Promise<GalleryImage[]> => {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('id, src, alt')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  
  if (data && data.length > 0) {
    return data.map((item, index) => ({
      id: index + 1,
      src: item.src,
      alt: item.alt
    }));
  }
  
  return DEFAULT_IMAGES;
};

// Singleton channel para evitar múltiplas subscriptions
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let subscriberCount = 0;

export const useGallery = () => {
  const queryClient = useQueryClient();

  const { data: images = DEFAULT_IMAGES, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['gallery'],
    queryFn: fetchGalleryImages,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  useEffect(() => {
    subscriberCount++;

    // Cria channel apenas uma vez
    if (!realtimeChannel) {
      realtimeChannel = supabase
        .channel('gallery_realtime_singleton')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gallery_images' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
          }
        )
        .subscribe();
    }

    return () => {
      subscriberCount--;
      
      // Remove channel apenas quando não há mais subscribers
      if (subscriberCount === 0 && realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  }, [queryClient]);

  return { 
    images, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  };
};
