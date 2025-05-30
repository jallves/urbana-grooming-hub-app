
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { GalleryImage as GalleryImageType } from "@/types/settings";

export const useGalleryImages = () => {
  const [images, setImages] = useState<GalleryImageType[]>([]);
  const [loading, setLoading] = useState(true);

  // Define default images
  const defaultImages: GalleryImageType[] = [
    { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
    { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
    { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
    { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
    { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
    { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
  ];

  // Function to fetch gallery images
  const fetchGalleryImages = async () => {
    try {
      console.log('🖼️ Buscando imagens da galeria no Supabase...');
      
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao buscar galeria:', error);
        console.log('📷 Usando imagens padrão');
        setImages(defaultImages);
        return;
      }

      if (data && data.length > 0) {
        console.log(`✅ ${data.length} imagens encontradas no Supabase`);
        const formattedData: GalleryImageType[] = data.map((item, index) => ({
          id: index + 1,
          src: item.src,
          alt: item.alt || `Imagem ${index + 1}`
        }));
        setImages(formattedData);
        console.log('🎯 Imagens formatadas e definidas:', formattedData);
      } else {
        console.log('📷 Nenhuma imagem ativa encontrada, usando padrão');
        setImages(defaultImages);
      }
    } catch (error) {
      console.error('💥 Erro inesperado:', error);
      console.log('📷 Usando imagens padrão devido ao erro');
      setImages(defaultImages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryImages();

    // Listen for real-time updates
    const channel = supabase
      .channel('gallery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_images'
        },
        (payload) => {
          console.log('🔄 Mudança na galeria detectada:', payload);
          fetchGalleryImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { images, loading };
};
