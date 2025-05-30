
import { useState, useEffect } from 'react';
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

  const loadImages = () => {
    try {
      console.log('🖼️ Carregando galeria da homepage...');
      
      // Try to load from localStorage first
      const savedImages = localStorage.getItem('galleryImages');
      if (savedImages) {
        const parsedImages = JSON.parse(savedImages);
        console.log('📸 Imagens carregadas do localStorage para homepage:', parsedImages.length);
        setImages(parsedImages);
      } else {
        console.log('📸 Usando imagens padrão na homepage');
        setImages(defaultImages);
      }
      
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
      console.log('🔄 Galeria atualizada via painel admin na homepage:', event.detail.images);
      setImages(event.detail.images);
    };

    // Listen for storage changes (when localStorage is updated from another tab/window)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'galleryImages' && event.newValue) {
        try {
          const newImages = JSON.parse(event.newValue);
          console.log('🔄 Galeria atualizada via storage event:', newImages.length);
          setImages(newImages);
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
