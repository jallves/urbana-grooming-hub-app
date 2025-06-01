
import { useState, useEffect } from 'react';
import { BannerImage } from "@/types/settings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBannerImages = () => {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Define default banners
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
        console.log('Buscando banners do banco de dados...');
        
        const { data, error } = await supabase
          .from('banner_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (error) {
          console.error('Erro ao buscar banners:', error);
          throw error;
        }

        if (data && data.length > 0) {
          console.log('Banners carregados do banco:', data.length);
          setBannerImages(data.map(item => ({
            id: item.id,
            image_url: item.image_url,
            title: item.title,
            subtitle: item.subtitle,
            description: item.description || '',
            button_text: item.button_text || 'Agendar Agora',
            button_link: item.button_link || '/cliente/login',
            is_active: item.is_active,
            display_order: item.display_order
          })));
        } else {
          console.log('Nenhum banner encontrado no banco, usando padrões');
          setBannerImages(defaultBanners);
        }
      } catch (error) {
        console.error('Erro ao carregar banners:', error);
        console.log('Usando banners padrão devido ao erro');
        setBannerImages(defaultBanners);
      } finally {
        setLoading(false);
      }
    };

    fetchBannerImages();
  }, []);

  return { bannerImages, loading };
};
