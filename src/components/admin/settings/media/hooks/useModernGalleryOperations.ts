
import { useState, useEffect } from 'react';
import { GalleryImage } from '@/types/settings';

export const useModernGalleryOperations = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  // Simple notification function
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`${type === 'error' ? '❌' : '✅'} ${message}`);
    
    // Create a simple visual notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white font-medium transform transition-all duration-300 ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setIsLoading(true);
        console.log('📂 Carregando galeria do admin...');
        
        // Simulate loading default images since we don't have Supabase storage configured
        const defaultImages: GalleryImage[] = [
          { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
          { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
          { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
          { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
          { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
          { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
        ];
        
        setGalleryImages(defaultImages);
        console.log(`📸 ${defaultImages.length} imagens carregadas no admin`);
      } catch (error) {
        console.error('❌ Erro ao carregar galeria:', error);
        showNotification("Erro ao carregar galeria", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadGalleryImages();
  }, []);

  const addImage = async (
    imageData: { alt: string },
    file?: File
  ): Promise<boolean> => {
    if (!file) {
      showNotification("Selecione uma imagem para fazer upload", "error");
      return false;
    }

    if (!imageData.alt.trim()) {
      showNotification("Adicione uma descrição para a imagem", "error");
      return false;
    }

    try {
      setUploading(true);
      console.log('🚀 Iniciando upload da imagem...');
      
      // Create a URL for the uploaded file (since we can't upload to Supabase storage yet)
      const imageUrl = URL.createObjectURL(file);
      
      // Create new gallery image entry
      const newGalleryImage: GalleryImage = {
        id: Date.now(), // Simple ID generation
        src: imageUrl,
        alt: imageData.alt
      };
      
      setGalleryImages(prev => [...prev, newGalleryImage]);
      
      showNotification("✅ Imagem adicionada à galeria com sucesso!");
      console.log('🎯 Imagem adicionada à galeria:', newGalleryImage);
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('galleryUpdated', { 
        detail: { images: [...galleryImages, newGalleryImage] } 
      }));
      
      return true;
    } catch (error) {
      console.error('💥 Erro ao adicionar imagem:', error);
      showNotification("Erro ao adicionar imagem", "error");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const updateImage = async (updatedImage: GalleryImage): Promise<boolean> => {
    try {
      setGalleryImages(prev => 
        prev.map(img => 
          img.id === updatedImage.id ? updatedImage : img
        )
      );
      
      showNotification("Imagem atualizada com sucesso");
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('galleryUpdated', { 
        detail: { images: galleryImages.map(img => img.id === updatedImage.id ? updatedImage : img) } 
      }));
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      showNotification("Erro ao atualizar imagem", "error");
      return false;
    }
  };

  const deleteImage = async (id: number): Promise<boolean> => {
    try {
      const updatedImages = galleryImages.filter(img => img.id !== id);
      setGalleryImages(updatedImages);
      
      showNotification("Imagem removida da galeria");
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('galleryUpdated', { 
        detail: { images: updatedImages } 
      }));
      
      return true;
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      showNotification("Erro ao remover imagem", "error");
      return false;
    }
  };

  const reorderImages = async (id: number, direction: 'up' | 'down'): Promise<boolean> => {
    const currentIndex = galleryImages.findIndex(img => img.id === id);
    if (currentIndex === -1) return false;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= galleryImages.length) return false;
    
    try {
      const updatedImages = [...galleryImages];
      const temp = updatedImages[currentIndex];
      updatedImages[currentIndex] = updatedImages[newIndex];
      updatedImages[newIndex] = temp;
      
      setGalleryImages(updatedImages);
      
      showNotification("Ordem das imagens atualizada");
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('galleryUpdated', { 
        detail: { images: updatedImages } 
      }));
      
      return true;
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      showNotification("Erro ao reordenar imagens", "error");
      return false;
    }
  };

  return {
    galleryImages,
    isLoading,
    uploading,
    editingImage,
    setEditingImage,
    addImage,
    updateImage,
    deleteImage,
    reorderImages
  };
};
