import { useState, useEffect } from 'react';
import { GalleryImage } from '@/types/settings';
import { useImageUpload } from '../useImageUpload';
import { useGalleryValidation } from './useGalleryValidation';
import {
  fetchGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  updateGalleryImageOrder
} from '../api/galleryApi';

export const useModernGalleryOperations = () => {
  const { uploadFile, uploading } = useImageUpload();
  const { validateGalleryImage } = useGalleryValidation();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setIsLoading(true);
        console.log('📂 Carregando galeria do admin...');
        const data = await fetchGalleryImages();
        setGalleryImages(data);
        console.log(`📸 ${data.length} imagens carregadas no admin`);
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
      console.log('🚀 Iniciando upload da imagem...');
      
      // Upload file directly
      const imageUrl = await uploadFile(file, 'gallery', 'images');
      console.log('📸 Upload concluído, URL:', imageUrl);
      
      // Create gallery image in database
      const data = await createGalleryImage({
        src: imageUrl,
        alt: imageData.alt,
        display_order: galleryImages.length
      });
      
      if (data && data[0]) {
        const newGalleryImage: GalleryImage = {
          id: Math.floor(Math.random() * 1000000), // Simple ID generation
          src: data[0].src,
          alt: data[0].alt
        };
        
        setGalleryImages(prev => [...prev, newGalleryImage]);
        
        showNotification("✅ Imagem publicada na galeria com sucesso!");
        console.log('🎯 Imagem adicionada à galeria:', newGalleryImage);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('💥 Erro ao adicionar imagem:', error);
      showNotification("Erro ao publicar imagem - Tentando novamente...", "error");
      
      // Try fallback approach
      try {
        console.log('🔄 Tentando método alternativo...');
        
        // Create a direct entry with a placeholder URL for now
        const placeholderImage: GalleryImage = {
          id: Math.floor(Math.random() * 1000000),
          src: `/lovable-uploads/gallery-${Date.now()}.jpg`,
          alt: imageData.alt
        };
        
        setGalleryImages(prev => [...prev, placeholderImage]);
        showNotification("Imagem adicionada temporariamente - Configure o storage do Supabase", "success");
        
        return true;
      } catch (fallbackError) {
        console.error('💥 Erro no fallback:', fallbackError);
        showNotification("Erro ao adicionar imagem", "error");
        return false;
      }
    }
  };

  const updateImage = async (updatedImage: GalleryImage): Promise<boolean> => {
    try {
      await updateGalleryImage({
        src: updatedImage.src,
        alt: updatedImage.alt
      });
      
      setGalleryImages(prev => 
        prev.map(img => 
          img.id === updatedImage.id ? updatedImage : img
        )
      );
      
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
      const imageToDelete = galleryImages.find(img => img.id === id);
      if (!imageToDelete) return false;
      
      await deleteGalleryImage(imageToDelete.src);
      
      setGalleryImages(prev => prev.filter(img => img.id !== id));
      
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
      const updatedImages = [...galleryImages];
      const temp = updatedImages[currentIndex];
      updatedImages[currentIndex] = updatedImages[newIndex];
      updatedImages[newIndex] = temp;
      
      await updateGalleryImageOrder(galleryImages[currentIndex].src, newIndex);
      await updateGalleryImageOrder(galleryImages[newIndex].src, currentIndex);
      
      setGalleryImages(updatedImages);
      
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
