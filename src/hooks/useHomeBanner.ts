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
    let timeoutId: NodeJS.Timeout;
    
    console.log('[Banner Hook] 🚀 Inicializando...');

    const fetchBanners = async () => {
      console.log('[Banner Hook] 📡 Buscando dados...');
      
      try {
        // Timeout de 10 segundos
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Timeout')), 10000);
        });

        const fetchPromise = supabase
          .from('banner_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        const { data: banners, error: fetchError } = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]) as any;

        clearTimeout(timeoutId);

        if (!mounted) {
          console.log('[Banner Hook] ⚠️ Componente desmontado');
          return;
        }

        if (fetchError) {
          console.error('[Banner Hook] ❌ Erro:', fetchError.message);
          setStatus('success'); // Usa fallback
        } else if (banners && banners.length > 0) {
          console.log('[Banner Hook] ✅ Carregados:', banners.length, 'banners');
          setData(banners);
          setStatus('success');
        } else {
          console.log('[Banner Hook] ⚠️ Nenhum banner ativo encontrado');
          setStatus('success'); // Usa fallback
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (!mounted) return;
        
        console.error('[Banner Hook] ❌ Exceção:', err?.message || 'Erro desconhecido');
        setStatus('success'); // Usa fallback
      }
    };

    fetchBanners();

    return () => {
      console.log('[Banner Hook] 🔚 Desmontando...');
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
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
