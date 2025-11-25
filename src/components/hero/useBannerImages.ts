
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
    let isMounted = true;
    
    const fetchBannerImages = async (retryCount = 0) => {
      try {
        if (!isMounted) return;
        
        if (retryCount === 0) {
          setLoading(true);
        }
        
        console.log('[PWA Banner] 🔍 Tentativa:', retryCount + 1);
        console.log('[PWA Banner] 🔧 Supabase client:', supabase ? 'OK' : 'ERRO');
        
        const { data, error } = await supabase
          .from('banner_images')
          .select('*')
          .order('display_order', { ascending: true })
          .eq('is_active', true);
        
        console.log('[PWA Banner] 📡 Resposta recebida');
        console.log('[PWA Banner] 📊 Data:', data?.length || 0, 'banners');
        console.log('[PWA Banner] ❌ Error:', error?.message || 'nenhum');
        
        if (!isMounted) return;
        
        if (error) {
          console.error('[PWA Banner] ❌ Erro:', error.message);
          
          if (retryCount < 2) {
            console.log('[PWA Banner] 🔄 Retry em 1s...');
            setTimeout(() => {
              if (isMounted) {
                fetchBannerImages(retryCount + 1);
              }
            }, 1000);
            return;
          }
          
          throw error;
        }

        if (data && data.length > 0) {
          console.log('[PWA Banner] ✅ Banners carregados:', data.length);
          setBannerImages(data);
        } else {
          console.log('[PWA Banner] ⚠️ Sem banners ativos, usando fallback');
          setBannerImages(defaultBanners);
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('[PWA Banner] ❌ Falha crítica:', error);
        setBannerImages(defaultBanners);
        
        if (retryCount >= 2) {
          toast({
            title: "Usando banners padrão",
            description: "Não foi possível carregar os banners personalizados.",
            variant: "default",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBannerImages();
    
    return () => {
      isMounted = false;
    };
  }, []); // Remove toast das dependências para evitar loop infinito

  return { bannerImages, loading };
};
