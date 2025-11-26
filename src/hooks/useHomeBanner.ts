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
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<BannerImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBanners = async () => {
      setStatus('loading');
      setError(null);

      try {
        const { data: banners, error: fetchError } = await supabase
          .from('banner_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (cancelled) return;

        if (fetchError) {
          console.error('[Banner Hook] Erro:', fetchError.message);
          setData(defaultBanners);
          setStatus('success');
        } else if (banners && banners.length > 0) {
          console.log('[Banner Hook] ✅ Carregados:', banners.length, 'banners');
          setData(banners);
          setStatus('success');
        } else {
          console.log('[Banner Hook] ⚠️ Vazio - usando fallback');
          setData(defaultBanners);
          setStatus('success');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('[Banner Hook] Exceção:', err?.message);
        setData(defaultBanners);
        setStatus('success');
      }
    };

    fetchBanners();

    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = async () => {
    setStatus('loading');
    setError(null);
    
    try {
      const { data: banners, error: fetchError } = await supabase
        .from('banner_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        setData(defaultBanners);
        setStatus('success');
      } else if (banners && banners.length > 0) {
        setData(banners);
        setStatus('success');
      } else {
        setData(defaultBanners);
        setStatus('success');
      }
    } catch {
      setData(defaultBanners);
      setStatus('success');
    }
  };

  return { status, data, error, refetch };
};
