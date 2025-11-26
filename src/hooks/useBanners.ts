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
        console.error('Erro ao buscar banners:', fetchError);
        setError(fetchError.message);
        setBanners([DEFAULT_BANNER]);
        return;
      }

      if (data && data.length > 0) {
        setBanners(data);
      } else {
        setBanners([DEFAULT_BANNER]);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro ao carregar banners');
      setBanners([DEFAULT_BANNER]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return { 
    banners, 
    loading, 
    error, 
    refetch: fetchBanners 
  };
};
