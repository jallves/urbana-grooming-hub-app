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
  const [data, setData] = useState<BannerImage[]>(defaultBanners);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    console.log('[Banner Hook] 🚀 Inicializando...');

    const fetchBanners = async () => {
      console.log('[Banner Hook] 📡 Buscando dados do Supabase...');
      
      try {
        const { data: banners, error: fetchError } = await supabase
          .from('banner_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        console.log('[Banner Hook] 📦 Resposta recebida:', { 
          hasData: !!banners, 
          count: banners?.length, 
          hasError: !!fetchError,
          error: fetchError 
        });

        if (!mounted) {
          console.log('[Banner Hook] ⚠️ Componente desmontado');
          return;
        }

        if (fetchError) {
          console.error('[Banner Hook] ❌ Erro Supabase:', fetchError);
          setError(fetchError.message);
          setStatus('success'); // Usa fallback
        } else if (banners && banners.length > 0) {
          console.log('[Banner Hook] ✅ Banners carregados:', banners);
          setData(banners);
          setStatus('success');
        } else {
          console.log('[Banner Hook] ⚠️ Nenhum banner encontrado');
          setStatus('success'); // Usa fallback
        }
      } catch (err: any) {
        if (!mounted) return;
        
        console.error('[Banner Hook] ❌ Exceção capturada:', {
          message: err?.message,
          name: err?.name,
          stack: err?.stack,
          full: err
        });
        setError(err?.message || 'Erro ao carregar banners');
        setStatus('success'); // Usa fallback
      }
    };

    fetchBanners();

    return () => {
      console.log('[Banner Hook] 🔚 Desmontando...');
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
