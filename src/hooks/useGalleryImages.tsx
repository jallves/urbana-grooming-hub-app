
import { useState, useEffect } from 'react';
import { galleryService, GalleryPhoto } from '@/services/galleryService';

export const useGalleryImages = () => {
  const [images, setImages] = useState<Array<{id: number, src: string, alt: string}>>([]);
  const [loading, setLoading] = useState(true);

  const loadImages = () => {
    try {
      console.log('🖼️ Carregando galeria da homepage...');
      setLoading(true);
      
      const publishedPhotos = galleryService.getPublishedPhotos();
      
      // Converter para formato compatível com a galeria existente
      const formattedImages = publishedPhotos.map((photo, index) => ({
        id: parseInt(photo.id.replace(/[^0-9]/g, '')) || index + 1,
        src: photo.src,
        alt: photo.alt
      }));
      
      setImages(formattedImages);
      console.log(`📸 ${formattedImages.length} imagens carregadas na homepage`);
    } catch (error) {
      console.error('❌ Erro ao carregar galeria na homepage:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
    
    // Listener para atualizações da galeria
    const handleGalleryUpdate = (event: CustomEvent) => {
      console.log('🔄 Galeria atualizada via evento na homepage');
      loadImages();
    };

    // Listener para refresh forçado
    const handleGalleryRefresh = () => {
      console.log('🔄 Refresh forçado da galeria');
      loadImages();
    };

    // Listener para mudanças no localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'barbearia_gallery_photos') {
        console.log('🔄 Galeria atualizada via storage event');
        loadImages();
      }
    };

    window.addEventListener('galleryUpdated', handleGalleryUpdate as EventListener);
    window.addEventListener('galleryRefresh', handleGalleryRefresh);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('galleryUpdated', handleGalleryUpdate as EventListener);
      window.removeEventListener('galleryRefresh', handleGalleryRefresh);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const reloadImages = () => {
    loadImages();
  };

  return { images, loading, reloadImages };
};
