import { useState, useEffect, useRef } from 'react';
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
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchBanners = async () => {
    // Evita fetches duplicados simultâneos
    if (fetchingRef.current) {
      console.log('🎯 [useBanners] Fetch já em andamento, ignorando...');
      return;
    }

    fetchingRef.current = true;
    console.log('🚀 [useBanners] Iniciando fetch...');
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('banner_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!mountedRef.current) return;
      
      console.log('📦 [useBanners] Resposta:', { count: data?.length || 0 });

      if (fetchError) {
        console.error('[useBanners] Erro:', fetchError);
        setError(fetchError.message);
        setBanners([DEFAULT_BANNER]);
      } else if (data && data.length > 0) {
        console.log('[useBanners] ✅', data.length, 'banners carregados');
        setBanners(data);
      } else {
        setBanners([DEFAULT_BANNER]);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error('[useBanners] Exceção:', err);
      setError(err.message);
      setBanners([DEFAULT_BANNER]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
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
      mountedRef.current = false;
      fetchingRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { banners, loading, error, refetch: fetchBanners };
};
