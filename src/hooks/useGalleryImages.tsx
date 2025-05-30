
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGalleryImages = () => {
  const [images, setImages] = useState<Array<{id: number, src: string, alt: string}>>([]);
  const [loading, setLoading] = useState(true);

  const loadImages = async () => {
    try {
      console.log('🖼️ Carregando galeria da homepage do banco de dados...');
      setLoading(true);
      
      // Buscar fotos publicadas do banco de dados
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Erro ao carregar do banco:', error);
        // Fallback para fotos padrão se houver erro
        const defaultImages = [
          { id: 1, src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&h=400&fit=crop", alt: "Corte Clássico Masculino" },
          { id: 2, src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop", alt: "Barba Estilizada Profissional" },
          { id: 3, src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500&h=400&fit=crop", alt: "Ambiente Premium da Barbearia" }
        ];
        setImages(defaultImages);
        return;
      }

      // Converter para formato compatível com a galeria existente
      const formattedImages = data?.map((photo, index) => ({
        id: index + 1, // ID sequencial para compatibilidade
        src: photo.image_url,
        alt: photo.alt_text
      })) || [];
      
      setImages(formattedImages);
      console.log(`📸 ${formattedImages.length} imagens carregadas do banco na homepage`);
    } catch (error) {
      console.error('❌ Erro ao carregar galeria na homepage:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
    
    // Listener para atualizações da galeria via eventos customizados
    const handleGalleryUpdate = () => {
      console.log('🔄 Galeria atualizada - recarregando do banco');
      loadImages();
    };

    // Listener para mudanças em tempo real do Supabase
    const subscription = supabase
      .channel('gallery-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'gallery_photos' 
        }, 
        (payload) => {
          console.log('🔄 Mudança detectada no banco:', payload);
          loadImages();
        }
      )
      .subscribe();

    window.addEventListener('galleryUpdated', handleGalleryUpdate);
    window.addEventListener('galleryRefresh', handleGalleryUpdate);
    
    return () => {
      window.removeEventListener('galleryUpdated', handleGalleryUpdate);
      window.removeEventListener('galleryRefresh', handleGalleryUpdate);
      subscription.unsubscribe();
    };
  }, []);

  const reloadImages = () => {
    loadImages();
  };

  return { images, loading, reloadImages };
};
