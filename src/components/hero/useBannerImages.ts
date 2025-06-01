
import { useState, useEffect } from 'react';
import { BannerImage } from "@/types/settings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBannerImages = () => {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Define default banners outside the effect for easier access
  const defaultBanners: BannerImage[] = [
    {
      id: '1',
      title: 'Experiência Premium',
      subtitle: 'em Barbearia',
      image_url: '/hero-background.jpg',
      button_text: 'Agendar Agora',
      button_link: '/cliente/login',
      is_active: true,
      display_order: 1
    },
    {
      id: '2',
      title: 'Estilo & Precisão',
      subtitle: 'para Cavalheiros',
      image_url: '/banner-2.jpg',
      button_text: 'Agendar Agora',
      button_link: '/cliente/login',
      is_active: true,
      display_order: 2
    },
    {
      id: '3',
      title: 'Ambiente Exclusivo',
      subtitle: 'para Relaxar',
      image_url: '/banner-3.jpg',
      button_text: 'Agendar Agora',
      button_link: '/cliente/login',
      is_active: true,
      display_order: 3
    }
  ];

  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        setLoading(true);
        console.log('Tentando buscar imagens do banner');
        
        // Set a timeout to ensure we don't wait too long for the database
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 3000); // 3 seconds timeout
        });
        
        const fetchPromise = supabase
          .from('banner_images')
          .select('*')
          .order('display_order', { ascending: true })
          .eq('is_active', true);
          
        // Race between the fetch and timeout
        const result = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]);
        
        if (result === null) {
          console.log('Timeout ao buscar banners, usando fallback');
          throw new Error('Timeout ao buscar banners');
        }
        
        const { data, error } = result;
        
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
