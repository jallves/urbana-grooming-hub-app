
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { GalleryImage as GalleryImageType } from "@/types/settings";

export const useGalleryImages = () => {
  const [images, setImages] = useState<GalleryImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch gallery images from Supabase
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        console.log('Tentando buscar imagens da galeria');
        
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .order('display_order', { ascending: true })
          .eq('is_active', true);
        
        if (error) {
          console.error('Erro ao buscar galeria:', error);
          throw error;
        }

        if (data && data.length > 0) {
          console.log('Imagens da galeria encontradas:', data.length);
          const formattedData: GalleryImageType[] = data.map(item => ({
            id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
            src: item.src,
            alt: item.alt
          }));
          setImages(formattedData);
        } else {
          console.log('Nenhuma imagem da galeria encontrada, usando fallback');
          // Fallback to default images if no data is available
          setImages([
            { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
            { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
            { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
            { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
            { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
            { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
          ]);
        }
      } catch (error) {
        console.error('Error loading gallery images:', error);
        // Fallback to default images if there's an error
        setImages([
          { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
          { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
          { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
          { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
          { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
          { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
        ]);
        
        toast({
          title: "Erro ao carregar galeria",
          description: "Usando imagens padrão para exibição",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, [toast]);

  return { images, loading };
};
