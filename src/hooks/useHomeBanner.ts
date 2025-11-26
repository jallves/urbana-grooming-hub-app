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
    let timeoutId: NodeJS.Timeout | null = null;

    setStatus('loading');
    setError(null);

    try {
      let timedOut = false;

      // Timeout de 8 segundos
      timeoutId = setTimeout(() => {
        timedOut = true;
      }, 8000);

      const { data: banners, error: fetchError } = await supabase
        .from('banner_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (timeoutId) clearTimeout(timeoutId);

      if (cancelled) return;

      // Se deu timeout E não conseguiu dados
      if (timedOut && !banners) {
        console.warn('[Banner Hook] Timeout - usando fallback');
        setData(defaultBanners);
        setStatus('success');
        return;
      }

      if (fetchError) {
        console.error('[Banner Hook] ❌ Erro:', fetchError.message);
        setData(defaultBanners);
        setStatus('success');
      } else if (banners && banners.length > 0) {
        console.log('[Banner Hook] ✅ Carregados:', banners.length, 'banners');
        setData(banners);
        setStatus('success');
      } else {
        console.log('[Banner Hook] ⚠️ Sem banners - usando fallback');
        setData(defaultBanners);
        setStatus('success');
      }
    } catch (err: any) {
      if (cancelled) return;
      if (timeoutId) clearTimeout(timeoutId);
      
      console.error('[Banner Hook] Exceção:', err?.message);
      setData(defaultBanners);
      setStatus('success'); // Usar fallback sem mostrar erro
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    console.log('[useHomeBanner] 🚀 Iniciando fetch de banners...');
    fetchBanners();
  }, [fetchBanners]);

  const refetch = useCallback(() => {
    fetchBanners();
  }, [fetchBanners]);

  return { status, data, error, refetch };
};
