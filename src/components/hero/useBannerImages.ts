
import { useState, useEffect } from 'react';
import { BannerImage } from "@/types/settings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBannerImages = () => {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        setLoading(true);
        console.log('Tentando buscar imagens do banner');
        
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
          const formattedData: BannerImage[] = data.map(item => ({
            id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
            imageUrl: item.image_url,
            title: item.title,
            subtitle: item.subtitle,
            description: item.description || ''
          }));
          setBannerImages(formattedData);
        } else {
          console.log('Nenhum banner encontrado, usando fallback');
          // Fallback to default banners if no data is available
          setBannerImages([
            {
              id: 1,
              imageUrl: '/hero-background.jpg',
              title: 'Experiência Premium',
              subtitle: 'em Barbearia',
              description: 'A arte da barbearia tradicional com sofisticação moderna'
            },
            {
              id: 2,
              imageUrl: '/banner-2.jpg',
              title: 'Estilo & Precisão',
              subtitle: 'para Cavalheiros',
              description: 'Cortes clássicos com um toque contemporâneo'
            },
            {
              id: 3,
              imageUrl: '/banner-3.jpg',
              title: 'Ambiente Exclusivo',
              subtitle: 'para Relaxar',
              description: 'Um espaço onde tradição e conforto se encontram'
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading banner images:', error);
        // Fallback to default banners if there's an error
        setBannerImages([
          {
            id: 1,
            imageUrl: '/hero-background.jpg',
            title: 'Experiência Premium',
            subtitle: 'em Barbearia',
            description: 'A arte da barbearia tradicional com sofisticação moderna'
          },
          {
            id: 2,
            imageUrl: '/banner-2.jpg',
            title: 'Estilo & Precisão',
            subtitle: 'para Cavalheiros',
            description: 'Cortes clássicos com um toque contemporâneo'
          },
          {
            id: 3,
            imageUrl: '/banner-3.jpg',
            title: 'Ambiente Exclusivo',
            subtitle: 'para Relaxar',
            description: 'Um espaço onde tradição e conforto se encontram'
          }
        ]);
        
        toast({
          title: "Erro ao carregar banners",
          description: "Usando imagens padrão para exibição",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBannerImages();
  }, [toast]);

  return { bannerImages, loading };
};
