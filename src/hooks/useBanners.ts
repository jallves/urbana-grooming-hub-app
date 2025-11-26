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
      console.log('🎨 [useBanners] Iniciando busca...');
      setLoading(true);
      setError(null);
      
      // Timeout de 5 segundos para evitar travamento
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao buscar banners')), 5000)
      );
      
      const queryPromise = supabase
        .from('banner_images')
        .select('*')
        .order('display_order', { ascending: true });

      const { data, error: fetchError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (fetchError) {
        console.error('❌ [useBanners] Erro:', fetchError.message);
        setError(fetchError.message);
        setBanners([DEFAULT_BANNER]);
        return;
      }

      console.log('✅ [useBanners] Carregados:', data?.length || 0);
      
      if (data && data.length > 0) {
        setBanners(data);
      } else {
        setBanners([DEFAULT_BANNER]);
      }
    } catch (err) {
      console.error('❌ [useBanners] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
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
