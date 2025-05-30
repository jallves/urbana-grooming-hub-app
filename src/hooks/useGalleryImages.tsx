
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { GalleryImage as GalleryImageType } from "@/types/settings";

export const useGalleryImages = () => {
  const [images, setImages] = useState<GalleryImageType[]>([]);
  const [loading, setLoading] = useState(true);

  // Define default images outside the effect for easier access
  const defaultImages: GalleryImageType[] = [
    { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
    { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
    { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
    { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
    { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
    { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
  ];

  // Fetch gallery images from Supabase with better error handling
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        console.log('Tentando buscar imagens da galeria do Supabase');
        
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .order('display_order', { ascending: true })
          .eq('is_active', true);
        
        if (error) {
          console.error('Erro ao buscar galeria:', error);
          console.log('Usando imagens padrão devido ao erro da database');
          setImages(defaultImages);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          console.log('Imagens da galeria encontradas no Supabase:', data.length);
          const formattedData: GalleryImageType[] = data.map(item => ({
            id: parseInt(item.id.toString().substring(0, 8), 16),
            src: item.src,
            alt: item.alt
          }));
          setImages(formattedData);
          console.log('Imagens formatadas e carregadas:', formattedData);
        } else {
          console.log('Nenhuma imagem da galeria encontrada no Supabase, usando padrão');
          setImages(defaultImages);
        }
      } catch (error) {
        console.error('Error loading gallery images:', error);
        console.log('Usando imagens padrão devido ao erro');
        setImages(defaultImages);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  return { images, loading };
};
