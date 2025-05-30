
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

  // Simple toast function to replace useToast
  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    console.log(`${variant === 'destructive' ? 'ERROR' : 'SUCCESS'}: ${title} - ${description}`);
    // You can implement a custom toast here if needed
  };

  // Fetch gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGalleryImages();
        setGalleryImages(data);
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        showToast("Erro ao carregar galeria", "Não foi possível carregar as imagens da galeria", "destructive");
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
    try {
      let imageUrl = '';
      
      if (!file) {
        showToast("Erro", "Selecione uma imagem para fazer upload", "destructive");
        return false;
      }

      if (!validateGalleryImage(imageData.alt, 'placeholder')) {
        return false;
      }
      
      // Upload file
      try {
        console.log("Uploading gallery image to Supabase Storage");
        imageUrl = await uploadFile(file, 'gallery', 'images');
        console.log("Gallery image upload successful, URL:", imageUrl);
      } catch (uploadError) {
        console.error("Gallery upload error:", uploadError);
        showToast("Erro no upload", "Não foi possível fazer o upload da imagem", "destructive");
        return false;
      }
      
      // Create gallery image in database
      const data = await createGalleryImage({
        src: imageUrl,
        alt: imageData.alt,
        display_order: galleryImages.length
      });
      
      if (data && data[0]) {
        const newGalleryImage: GalleryImage = {
          id: parseInt(data[0].id.toString().replace(/-/g, '').substring(0, 8), 16),
          src: data[0].src,
          alt: data[0].alt
        };
        
        setGalleryImages(prev => [...prev, newGalleryImage]);
        
        showToast("Sucesso!", "Imagem adicionada à galeria com sucesso");
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding gallery image:', error);
      showToast("Erro ao adicionar imagem", "Ocorreu um erro ao adicionar a imagem à galeria", "destructive");
      return false;
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
      
      showToast("Sucesso!", "Imagem atualizada com sucesso");
      
      return true;
    } catch (error) {
      console.error('Error updating gallery image:', error);
      showToast("Erro ao atualizar", "Ocorreu um erro ao atualizar a imagem", "destructive");
      return false;
    }
  };

  const deleteImage = async (id: number): Promise<boolean> => {
    try {
      const imageToDelete = galleryImages.find(img => img.id === id);
      if (!imageToDelete) return false;
      
      await deleteGalleryImage(imageToDelete.src);
      
      setGalleryImages(prev => prev.filter(img => img.id !== id));
      
      showToast("Sucesso!", "Imagem removida da galeria com sucesso");
      
      return true;
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      showToast("Erro ao remover", "Ocorreu um erro ao remover a imagem da galeria", "destructive");
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
      
      // Update display_order in the database
      await updateGalleryImageOrder(galleryImages[currentIndex].src, newIndex);
      await updateGalleryImageOrder(galleryImages[newIndex].src, currentIndex);
      
      setGalleryImages(updatedImages);
      
      showToast("Sucesso!", "Ordem das imagens atualizada");
      
      return true;
    } catch (error) {
      console.error('Error updating display order:', error);
      showToast("Erro ao reordenar", "Ocorreu um erro ao atualizar a ordem das imagens", "destructive");
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
