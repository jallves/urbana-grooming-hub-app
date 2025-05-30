
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

  useEffect(() => {
    console.log('🖼️ Iniciando carregamento da galeria...');
    
    // Load initial images
    setImages(defaultImages);
    setLoading(false);
    
    // Listen for gallery updates from admin panel
    const handleGalleryUpdate = (event: CustomEvent) => {
      console.log('🔄 Galeria atualizada via painel admin:', event.detail.images);
      setImages(event.detail.images);
    };

    window.addEventListener('galleryUpdated', handleGalleryUpdate as EventListener);
    
    return () => {
      window.removeEventListener('galleryUpdated', handleGalleryUpdate as EventListener);
    };
  }, []);

  return { images, loading };
};
