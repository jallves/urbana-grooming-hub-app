
import { useState, useEffect } from 'react';
import { BannerImage } from "@/types/settings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBannerImages = () => {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchBannerImages = async (retryCount = 0) => {
      try {
        setLoading(true);
        console.log('[PWA Banner] Tentativa:', retryCount + 1);
        
        // Improved Supabase query with proper error handling
        const { data, error } = await supabase
          .from('banner_images')
          .select('*')
          .order('display_order', { ascending: true })
          .eq('is_active', true);
        
        if (error) {
          console.error('[PWA Banner] Erro:', error.message);
          
          // Retry até 3 vezes com delay
          if (retryCount < 3) {
            console.log('[PWA Banner] Retry em 2s...');
            setTimeout(() => fetchBannerImages(retryCount + 1), 2000);
            return;
          }
          
          throw error;
        }

        if (data && data.length > 0) {
          console.log('[PWA Banner] ✅ Carregados:', data.length);
          setBannerImages(data);
        } else {
          console.log('[PWA Banner] Usando fallback');
          setBannerImages(defaultBanners);
        }
      } catch (error) {
        console.error('[PWA Banner] ❌ Falha total:', error);
        setBannerImages(defaultBanners);
        
        if (retryCount >= 3) {
          toast({
            title: "Usando banners padrão",
            description: "Verifique sua conexão.",
            variant: "default",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBannerImages();
  }, [toast]);

  return { bannerImages, loading };
};
