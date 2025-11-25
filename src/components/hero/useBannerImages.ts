
import { useState, useEffect } from 'react';
import { BannerImage } from "@/types/settings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBannerImages = () => {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(true);
  const { toast } = useToast();

  // Define default banners - usando apenas imagens que existem
  const defaultBanners: BannerImage[] = [
    {
      id: '1',
      title: 'Costa Urbana Barbearia',
      subtitle: 'Estilo & Elegância',
      image_url: '/costa-urbana-logo.png',
      button_text: 'Agendar Agora',
      button_link: '/cliente/login',
      is_active: true,
      display_order: 1
    }
  ];

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const fetchBannerImages = async () => {
      try {
        // Timeout global de 8 segundos
        timeoutId = setTimeout(() => {
          console.warn('[Banner] ⏱️ Timeout após 8s - usando fallback');
          if (mounted) {
            setBannerImages(defaultBanners);
            setLoading(false);
          }
        }, 8000);

        setLoading(true);
        console.log('[Banner] 🔍 Buscando banners...');
        console.log('[Banner] 🔧 Supabase client:', supabase ? 'OK' : 'ERRO');
        
        const { data, error } = await supabase
          .from('banner_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        clearTimeout(timeoutId);

        if (!mounted) return;
        
        console.log('[Banner] 📊 Resposta:', data?.length || 0, 'banners');
        
        if (error) {
          console.error('[Banner] ❌ Erro:', error.message);
          setBannerImages(defaultBanners);
        } else if (data && data.length > 0) {
          console.log('[Banner] ✅ Sucesso');
          setBannerImages(data);
        } else {
          console.log('[Banner] ⚠️ Sem dados - usando fallback');
          setBannerImages(defaultBanners);
        }
      } catch (error: any) {
        clearTimeout(timeoutId!);
        if (!mounted) return;
        
        console.error('[Banner] ❌ Exceção:', error?.message);
        setBannerImages(defaultBanners);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBannerImages();
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { bannerImages, loading };
};
