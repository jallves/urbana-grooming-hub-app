import { useState, useEffect } from 'react';
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

export const useBanners = () => {
  const [banners, setBanners] = useState<BannerImage[]>([DEFAULT_BANNER]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('banner_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('[useBanners] Erro:', fetchError);
        setError(fetchError.message);
        setBanners([DEFAULT_BANNER]);
      } else if (data && data.length > 0) {
        console.log('[useBanners] Carregados:', data.length, 'banners');
        setBanners(data);
      } else {
        console.log('[useBanners] Nenhum banner, usando default');
        setBanners([DEFAULT_BANNER]);
      }
    } catch (err: any) {
      console.error('[useBanners] Exceção:', err);
      setError(err.message);
      setBanners([DEFAULT_BANNER]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();

    const channel = supabase
      .channel('banners_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banner_images' },
        () => fetchBanners()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { banners, loading, error, refetch: fetchBanners };
};
