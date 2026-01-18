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
      console.log('🖼️ [useBanners] Buscando banners ativos...');
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('banner_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('❌ [useBanners] Erro ao buscar banners:', fetchError);
        setError(fetchError.message);
        setBanners([DEFAULT_BANNER]);
        return;
      }

      console.log('✅ [useBanners] Banners encontrados:', data?.length || 0);

      if (data && data.length > 0) {
        const mappedBanners: BannerImage[] = data.map(item => ({
          id: item.id,
          image_url: item.image_url,
          title: item.title,
          subtitle: item.subtitle || '',
          description: item.description || '',
          button_text: item.button_text || 'Agendar Agora',
          button_link: item.button_link || '/painel-cliente/login',
          is_active: item.is_active,
          display_order: item.display_order
        }));
        setBanners(mappedBanners);
      } else {
        console.log('⚠️ [useBanners] Nenhum banner ativo, usando default');
        setBanners([DEFAULT_BANNER]);
      }
    } catch (err) {
      console.error('❌ [useBanners] Exceção:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setBanners([DEFAULT_BANNER]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return { banners, loading, error, refetch: fetchBanners };
};
