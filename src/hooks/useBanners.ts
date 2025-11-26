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
      console.log('🎨 [useBanners] Estado inicial - loading:', loading);
      setLoading(true);
      setError(null);
      
      console.log('🎨 [useBanners] Fazendo query ao Supabase...');
      const startTime = Date.now();
      
      const { data, error: fetchError } = await supabase
        .from('banner_images')
        .select('*')
        .order('display_order', { ascending: true });

      const elapsed = Date.now() - startTime;
      console.log(`🎨 [useBanners] Query completou em ${elapsed}ms`);

      if (fetchError) {
        console.error('❌ [useBanners] Erro ao buscar banners:', fetchError);
        console.error('❌ [useBanners] Detalhes do erro:', JSON.stringify(fetchError, null, 2));
        setError(fetchError.message);
        setBanners([DEFAULT_BANNER]);
        return;
      }

      console.log('✅ [useBanners] Banners carregados:', data?.length || 0);
      console.log('✅ [useBanners] Dados recebidos:', JSON.stringify(data, null, 2));
      
      if (data && data.length > 0) {
        console.log('🎨 [useBanners] Definindo banners no estado...');
        setBanners(data);
        console.log('🎨 [useBanners] Banners definidos com sucesso');
      } else {
        console.log('⚠️ [useBanners] Nenhum banner encontrado, usando default');
        setBanners([DEFAULT_BANNER]);
      }
    } catch (err) {
      console.error('❌ [useBanners] Erro inesperado:', err);
      console.error('❌ [useBanners] Stack trace:', err instanceof Error ? err.stack : 'N/A');
      setError('Erro ao carregar banners');
      setBanners([DEFAULT_BANNER]);
    } finally {
      console.log('🏁 [useBanners] Entrando no finally - setLoading(false)');
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
