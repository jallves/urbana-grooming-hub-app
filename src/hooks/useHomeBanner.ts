import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BannerImage } from '@/types/settings';

type Status = 'loading' | 'success' | 'error';

const defaultBanners: BannerImage[] = [
  {
    id: '1',
    title: 'Costa Urbana Barbearia',
    subtitle: 'Estilo & Elegância',
    image_url: '/costa-urbana-logo.png',
    button_text: 'Agendar Agora',
    button_link: '/painel-cliente/login',
    is_active: true,
    display_order: 1
  }
];

export const useHomeBanner = () => {
  const [status, setStatus] = useState<Status>('success');
  const [data, setData] = useState<BannerImage[]>(defaultBanners);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBanners = async () => {
      try {
        const { data: banners, error: fetchError } = await supabase
          .from('banner_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!mounted) return;

        if (fetchError) {
          console.error('[Banner] Erro ao carregar:', fetchError.message);
        } else if (banners && banners.length > 0) {
          console.log('[Banner] ✅ Carregados:', banners.length);
          setData(banners);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('[Banner] Exceção:', err?.message);
      }
    };

    fetchBanners();

    return () => {
      mounted = false;
    };
  }, []);

  const refetch = async () => {
    try {
      const { data: banners, error: fetchError } = await supabase
        .from('banner_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('[Banner] Erro no refetch:', fetchError.message);
      } else if (banners && banners.length > 0) {
        setData(banners);
      }
    } catch (err: any) {
      console.error('[Banner] Exceção no refetch:', err?.message);
    }
  };

  return { status, data, error, refetch };
};
