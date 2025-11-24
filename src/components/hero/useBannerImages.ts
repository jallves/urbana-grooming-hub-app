
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
    const fetchBannerImages = async () => {
      try {
        setLoading(true);
        console.log('Tentando buscar imagens do banner');
        
        // Improved Supabase query with proper error handling
        const { data, error } = await supabase
          .from('banner_images')
          .select('*')
          .order('display_order', { ascending: true })
          .eq('is_active', true);
        
        if (error) {
          console.error('Erro ao buscar banners:', error);
          throw error;
        }

        if (data && data.length > 0) {
          console.log('Banners encontrados:', data.length);
          setBannerImages(data);
        } else {
          console.log('Nenhum banner encontrado, usando fallback');
          // Fallback to default banners if no data is available
          setBannerImages(defaultBanners);
        }
      } catch (error) {
        console.error('Error loading banner images:', error);
        // Fallback to default banners if there's an error
        setBannerImages(defaultBanners);
        
        toast({
          title: "Usando banners padrão",
          description: "Não foi possível carregar os banners do banco de dados",
          variant: "default",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBannerImages();
  }, [toast]);

  return { bannerImages, loading };
};
