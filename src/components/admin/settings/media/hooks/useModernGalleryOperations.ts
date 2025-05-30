
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
        
        // Load from localStorage if available
        const savedImages = localStorage.getItem('galleryImages');
        let defaultImages: GalleryImage[] = [
          { id: 1, src: "/gallery-1.jpg", alt: "Corte Clássico" },
          { id: 2, src: "/gallery-2.jpg", alt: "Barba Estilizada" },
          { id: 3, src: "/gallery-3.jpg", alt: "Ambiente Premium" },
          { id: 4, src: "/gallery-4.jpg", alt: "Atendimento Exclusivo" },
          { id: 5, src: "/gallery-5.jpg", alt: "Produtos de Qualidade" },
          { id: 6, src: "/gallery-6.jpg", alt: "Experiência Completa" },
        ];

        if (savedImages) {
          try {
            const parsedImages = JSON.parse(savedImages);
            defaultImages = parsedImages;
            console.log('📸 Imagens carregadas do localStorage:', parsedImages.length);
          } catch (e) {
            console.warn('Erro ao carregar imagens do localStorage, usando padrão');
          }
        }
        
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

  // Save to localStorage whenever galleryImages changes
  useEffect(() => {
    if (galleryImages.length > 0) {
      localStorage.setItem('galleryImages', JSON.stringify(galleryImages));
      console.log('💾 Galeria salva no localStorage');
      
      // Trigger update event for homepage
      window.dispatchEvent(new CustomEvent('galleryUpdated', { 
        detail: { images: galleryImages } 
      }));
    }
  }, [galleryImages]);

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
      
      // Create a URL for the uploaded file
      const imageUrl = URL.createObjectURL(file);
      
      // Create new gallery image entry
      const newGalleryImage: GalleryImage = {
        id: Date.now(), // Simple ID generation
        src: imageUrl,
        alt: imageData.alt
      };
      
      // Update state
      setGalleryImages(prev => {
        const updatedImages = [...prev, newGalleryImage];
        console.log('🎯 Nova lista de imagens:', updatedImages);
        return updatedImages;
      });
      
      showNotification("✅ Imagem adicionada à galeria com sucesso!");
      console.log('🎯 Imagem adicionada à galeria:', newGalleryImage);
      
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
      setGalleryImages(prev => {
        const updatedImages = prev.map(img => 
          img.id === updatedImage.id ? updatedImage : img
        );
        console.log('🔄 Imagem atualizada:', updatedImage);
        return updatedImages;
      });
      
      showNotification("Imagem atualizada com sucesso");
      return true;
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      showNotification("Erro ao atualizar imagem", "error");
      return false;
    }
  };

  const deleteImage = async (id: number): Promise<boolean> => {
    try {
      setGalleryImages(prev => {
        const updatedImages = prev.filter(img => img.id !== id);
        console.log('🗑️ Imagem removida, nova lista:', updatedImages);
        return updatedImages;
      });
      
      showNotification("Imagem removida da galeria");
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
      setGalleryImages(prev => {
        const updatedImages = [...prev];
        const temp = updatedImages[currentIndex];
        updatedImages[currentIndex] = updatedImages[newIndex];
        updatedImages[newIndex] = temp;
        return updatedImages;
      });
      
      showNotification("Ordem das imagens atualizada");
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
