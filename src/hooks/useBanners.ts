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
      console.log('🎨 [useBanners] Iniciando busca de banners...');
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('banner_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('❌ [useBanners] Erro ao buscar banners:', fetchError);
        setError(fetchError.message);
        setBanners([DEFAULT_BANNER]);
        return;
      }

      console.log('✅ [useBanners] Banners carregados:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('🎨 [useBanners] Definindo banners:', data);
        setBanners(data);
      } else {
        console.log('⚠️ [useBanners] Nenhum banner encontrado, usando default');
        setBanners([DEFAULT_BANNER]);
      }
    } catch (err) {
      console.error('❌ [useBanners] Erro inesperado:', err);
      setError('Erro ao carregar banners');
      setBanners([DEFAULT_BANNER]);
    } finally {
      setLoading(false);
      console.log('🏁 [useBanners] Busca finalizada');
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
