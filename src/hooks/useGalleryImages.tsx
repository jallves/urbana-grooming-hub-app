
import { useState, useEffect } from 'react';
import type { GalleryImage as GalleryImageType } from "@/types/settings";

export const useGalleryImages = () => {
  const [images, setImages] = useState<GalleryImageType[]>([]);
  const [loading, setLoading] = useState(true);

  // Define default images with working placeholder URLs
  const defaultImages: GalleryImageType[] = [
    { id: 1, src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&h=400&fit=crop", alt: "Corte Clássico" },
    { id: 2, src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop", alt: "Barba Estilizada" },
    { id: 3, src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500&h=400&fit=crop", alt: "Ambiente Premium" },
    { id: 4, src: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&h=400&fit=crop", alt: "Atendimento Exclusivo" },
    { id: 5, src: "https://images.unsplash.com/photo-1622286346003-c8b29c15e5ad?w=500&h=400&fit=crop", alt: "Produtos de Qualidade" },
    { id: 6, src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop", alt: "Experiência Completa" },
  ];

  const loadImages = () => {
    try {
      console.log('🖼️ Carregando galeria da homepage...');
      
      // Try to load from localStorage first
      const savedImages = localStorage.getItem('galleryImages');
      if (savedImages) {
        try {
          const parsedImages = JSON.parse(savedImages);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            console.log('📸 Imagens carregadas do localStorage para homepage:', parsedImages.length);
            setImages(parsedImages);
            setLoading(false);
            return;
          }
        } catch (parseError) {
          console.warn('Erro ao fazer parse das imagens salvas:', parseError);
        }
      }
      
      console.log('📸 Usando imagens padrão na homepage');
      setImages(defaultImages);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao carregar galeria na homepage:', error);
      setImages(defaultImages);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
    
    // Listen for gallery updates from admin panel
    const handleGalleryUpdate = (event: CustomEvent) => {
      console.log('🔄 Galeria atualizada via painel admin na homepage:', event.detail.images?.length || 0);
      if (event.detail.images && Array.isArray(event.detail.images)) {
        setImages(event.detail.images);
      }
    };

    // Listen for storage changes (when localStorage is updated from another tab/window)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'galleryImages' && event.newValue) {
        try {
          const newImages = JSON.parse(event.newValue);
          if (Array.isArray(newImages)) {
            console.log('🔄 Galeria atualizada via storage event:', newImages.length);
            setImages(newImages);
          }
        } catch (error) {
          console.error('Erro ao processar storage event:', error);
        }
      }
    };

    window.addEventListener('galleryUpdated', handleGalleryUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('galleryUpdated', handleGalleryUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Reload function for manual refresh
  const reloadImages = () => {
    loadImages();
  };

  return { images, loading, reloadImages };
};
