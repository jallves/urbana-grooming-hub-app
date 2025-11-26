import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GalleryImage } from '@/types/settings';

const DEFAULT_IMAGES: GalleryImage[] = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
    alt: 'Barbeiro trabalhando com precisão',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=800',
    alt: 'Interior moderno da barbearia',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800',
    alt: 'Equipamentos profissionais',
  },
];

export const useGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>(DEFAULT_IMAGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = async () => {
    try {
      console.log('🖼️ [useGallery] Iniciando busca de imagens...');
      console.log('🖼️ [useGallery] Estado inicial - loading:', loading);
      setLoading(true);
      setError(null);
      
      console.log('🖼️ [useGallery] Fazendo query ao Supabase...');
      const startTime = Date.now();
      
      const { data, error: fetchError } = await supabase
        .from('gallery_images')
        .select('id, src, alt')
        .order('display_order', { ascending: true });

      const elapsed = Date.now() - startTime;
      console.log(`🖼️ [useGallery] Query completou em ${elapsed}ms`);

      if (fetchError) {
        console.error('❌ [useGallery] Erro ao buscar galeria:', fetchError);
        console.error('❌ [useGallery] Detalhes do erro:', JSON.stringify(fetchError, null, 2));
        setError(fetchError.message);
        setImages(DEFAULT_IMAGES);
        return;
      }

      console.log('✅ [useGallery] Imagens carregadas:', data?.length || 0);
      console.log('✅ [useGallery] Dados recebidos:', JSON.stringify(data, null, 2));

      if (data && data.length > 0) {
        const mappedImages = data.map((item, index) => ({
          id: index + 1,
          src: item.src,
          alt: item.alt
        }));
        console.log('🖼️ [useGallery] Definindo imagens no estado...');
        console.log('🖼️ [useGallery] Imagens mapeadas:', mappedImages);
        setImages(mappedImages);
        console.log('🖼️ [useGallery] Imagens definidas com sucesso');
      } else {
        console.log('⚠️ [useGallery] Nenhuma imagem encontrada, usando default');
        setImages(DEFAULT_IMAGES);
      }
    } catch (err) {
      console.error('❌ [useGallery] Erro inesperado:', err);
      console.error('❌ [useGallery] Stack trace:', err instanceof Error ? err.stack : 'N/A');
      setError('Erro ao carregar galeria');
      setImages(DEFAULT_IMAGES);
    } finally {
      console.log('🏁 [useGallery] Entrando no finally - setLoading(false)');
      setLoading(false);
      console.log('🏁 [useGallery] Busca finalizada');
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  return { 
    images, 
    loading, 
    error, 
    refetch: fetchGallery 
  };
};
