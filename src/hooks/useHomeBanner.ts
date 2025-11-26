import { useState, useEffect, useCallback } from 'react';
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

  const fetchBanners = useCallback(async () => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    setStatus('loading');
    setError(null);

    try {
      // Timeout de 8 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Timeout ao carregar banners'));
        }, 8000);
      });

      const fetchPromise = supabase
        .from('banner_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      const { data: banners, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);

      clearTimeout(timeoutId!);

      if (cancelled) return;

      if (fetchError) {
        console.error('[Banner Hook] Erro:', fetchError.message);
        setError('Não foi possível carregar os banners.');
        setData(defaultBanners);
        setStatus('error');
      } else if (banners && banners.length > 0) {
        setData(banners);
        setStatus('success');
      } else {
        // Sem banners, usar fallback sem erro
        setData(defaultBanners);
        setStatus('success');
      }
    } catch (err: any) {
      if (cancelled) return;
      console.error('[Banner Hook] Exceção:', err?.message);
      setError(err?.message || 'Erro ao carregar banners.');
      setData(defaultBanners);
      setStatus('error');
    }

    return () => {
      cancelled = true;
      if (timeoutId!) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const refetch = useCallback(() => {
    fetchBanners();
  }, [fetchBanners]);

  return { status, data, error, refetch };
};
