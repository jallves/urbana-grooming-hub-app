import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BannerImage } from '@/types/settings';

const DEFAULT_BANNER: BannerImage = {
  id: 'default',
  title: 'Costa Urbana Barbearia',
  subtitle: 'Estilo & Elegância',
  image_url: '/costa-urbana-logo.png',
  button_text: 'Agendar Agora',
  button_link: '/painel-cliente/login',
  is_active: true,
  display_order: 1
};

const fetchBanners = async (): Promise<BannerImage[]> => {
  const { data, error } = await supabase
    .from('banner_images')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data && data.length > 0 ? data : [DEFAULT_BANNER];
};

// Singleton channel para evitar múltiplas subscriptions
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let subscriberCount = 0;

export const useBanners = () => {
  const queryClient = useQueryClient();

  const { data: banners = [DEFAULT_BANNER], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['banners'],
    queryFn: fetchBanners,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  useEffect(() => {
    subscriberCount++;

    // Cria channel apenas uma vez
    if (!realtimeChannel) {
      realtimeChannel = supabase
        .channel('banners_realtime_singleton')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'banner_images' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
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
    banners, 
    loading, 
    error: error ? (error as Error).message : null, 
    refetch 
  };
};
