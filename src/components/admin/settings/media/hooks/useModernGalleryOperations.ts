
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

  // Unified save function that persists to localStorage and triggers events
  const saveGalleryImages = (images: GalleryImage[]) => {
    try {
      localStorage.setItem('galleryImages', JSON.stringify(images));
      console.log('💾 Galeria salva no localStorage:', images.length, 'imagens');
      
      // Trigger update event for homepage and other listeners
      window.dispatchEvent(new CustomEvent('galleryUpdated', { 
        detail: { images } 
      }));
      
      // Also trigger a refresh event to force reload
      window.dispatchEvent(new CustomEvent('galleryRefresh'));
    } catch (error) {
      console.error('❌ Erro ao salvar galeria:', error);
      showNotification('Erro ao salvar galeria', 'error');
    }
  };

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setIsLoading(true);
        console.log('📂 Carregando galeria do admin...');
        
        // Load from localStorage
        const savedImages = localStorage.getItem('galleryImages');
        let loadedImages: GalleryImage[] = [];
        
        if (savedImages) {
          try {
            const parsedImages = JSON.parse(savedImages);
            if (Array.isArray(parsedImages)) {
              loadedImages = parsedImages;
              console.log('📸 Imagens carregadas do localStorage no admin:', parsedImages.length);
            }
          } catch (e) {
            console.warn('Erro ao carregar imagens do localStorage, usando padrão');
          }
        }
        
        // If no saved images, use defaults
        if (loadedImages.length === 0) {
          loadedImages = [
            { id: 1, src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&h=400&fit=crop", alt: "Corte Clássico" },
            { id: 2, src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop", alt: "Barba Estilizada" },
            { id: 3, src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500&h=400&fit=crop", alt: "Ambiente Premium" },
            { id: 4, src: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&h=400&fit=crop", alt: "Atendimento Exclusivo" },
            { id: 5, src: "https://images.unsplash.com/photo-1622286346003-c8b29c15e5ad?w=500&h=400&fit=crop", alt: "Produtos de Qualidade" },
            { id: 6, src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop", alt: "Experiência Completa" },
          ];
          
          // Save defaults to localStorage
          saveGalleryImages(loadedImages);
        }
        
        setGalleryImages(loadedImages);
        console.log(`📸 ${loadedImages.length} imagens carregadas no admin`);
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
      
      // Create a URL for the uploaded file
      const imageUrl = URL.createObjectURL(file);
      
      // Create new gallery image entry
      const newGalleryImage: GalleryImage = {
        id: Date.now(), // Simple ID generation
        src: imageUrl,
        alt: imageData.alt
      };
      
      // Update state and save
      const updatedImages = [...galleryImages, newGalleryImage];
      setGalleryImages(updatedImages);
      
      // Save to localStorage and trigger events
      saveGalleryImages(updatedImages);
      
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
      const updatedImages = galleryImages.map(img => 
        img.id === updatedImage.id ? updatedImage : img
      );
      
      setGalleryImages(updatedImages);
      saveGalleryImages(updatedImages);
      
      showNotification("Imagem atualizada com sucesso");
      console.log('🔄 Imagem atualizada:', updatedImage);
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
      saveGalleryImages(updatedImages);
      
      showNotification("Imagem removida da galeria");
      console.log('🗑️ Imagem removida, nova lista:', updatedImages.length);
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
      saveGalleryImages(updatedImages);
      
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
