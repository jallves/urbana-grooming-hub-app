
import { useState, useEffect } from 'react';
import { GalleryImage } from '@/types/settings';
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const { uploadFile, uploading } = useImageUpload();
  const { validateGalleryImage } = useGalleryValidation();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  // Fetch gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGalleryImages();
        setGalleryImages(data);
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        toast({
          title: "Erro ao carregar galeria",
          description: "Não foi possível carregar as imagens da galeria",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGalleryImages();
  }, [toast]);

  const addImage = async (
    imageData: { alt: string },
    file?: File
  ): Promise<boolean> => {
    try {
      let imageUrl = '';
      
      if (!file) {
        toast({
          title: "Erro",
          description: "Selecione uma imagem para fazer upload",
          variant: "destructive",
        });
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
        toast({
          title: "Erro no upload",
          description: "Não foi possível fazer o upload da imagem",
          variant: "destructive",
        });
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
        
        toast({
          title: "Sucesso!",
          description: "Imagem adicionada à galeria com sucesso",
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding gallery image:', error);
      toast({
        title: "Erro ao adicionar imagem",
        description: "Ocorreu um erro ao adicionar a imagem à galeria",
        variant: "destructive",
      });
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
      
      toast({
        title: "Sucesso!",
        description: "Imagem atualizada com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating gallery image:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar a imagem",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteImage = async (id: number): Promise<boolean> => {
    try {
      const imageToDelete = galleryImages.find(img => img.id === id);
      if (!imageToDelete) return false;
      
      await deleteGalleryImage(imageToDelete.src);
      
      setGalleryImages(prev => prev.filter(img => img.id !== id));
      
      toast({
        title: "Sucesso!",
        description: "Imagem removida da galeria com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      toast({
        title: "Erro ao remover",
        description: "Ocorreu um erro ao remover a imagem da galeria",
        variant: "destructive",
      });
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
      
      toast({
        title: "Sucesso!",
        description: "Ordem das imagens atualizada",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating display order:', error);
      toast({
        title: "Erro ao reordenar",
        description: "Ocorreu um erro ao atualizar a ordem das imagens",
        variant: "destructive",
      });
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
