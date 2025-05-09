
import { useState, useEffect } from 'react';
import { GalleryImage } from '@/types/settings';
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from './useImageUpload';
import { useGalleryValidation } from './hooks/useGalleryValidation';
import {
  fetchGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  updateGalleryImageOrder
} from './api/galleryApi';

export const useGalleryOperations = (
  galleryImages: GalleryImage[],
  setGalleryImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>
) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useImageUpload();
  const { validateGalleryImage } = useGalleryValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  // Fetch gallery images from Supabase
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGalleryImages();
        setGalleryImages(data);
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        toast({
          title: "Erro ao carregar imagens",
          description: "Não foi possível carregar as imagens da galeria",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGalleryImages();
  }, [setGalleryImages, toast]);

  const handleAddGalleryImage = async (
    newImage: { src: string; alt: string },
    galleryUpload: { file: File; previewUrl: string } | null
  ) => {
    try {
      let imageUrl = newImage.src;
      
      // Validate the form data
      if (!validateGalleryImage(newImage.alt, galleryUpload ? 'placeholder' : imageUrl)) {
        return false;
      }
      
      // Upload file if provided
      if (galleryUpload) {
        try {
          console.log("Uploading gallery image to Supabase Storage");
          imageUrl = await uploadFile(galleryUpload.file, 'gallery', 'images');
          console.log("Gallery image upload successful, URL:", imageUrl);
        } catch (uploadError) {
          console.error("Gallery upload error:", uploadError);
          toast({
            title: "Erro no upload",
            description: "Não foi possível fazer o upload da imagem da galeria",
            variant: "destructive",
          });
          return false;
        }
      }
      
      // Create gallery image in Supabase
      const data = await createGalleryImage({
        src: imageUrl,
        alt: newImage.alt,
        display_order: galleryImages.length
      });
      
      if (data && data[0]) {
        const newGalleryImage: GalleryImage = {
          id: parseInt(data[0].id.toString().replace(/-/g, '').substring(0, 8), 16),
          src: data[0].src,
          alt: data[0].alt
        };
        
        setGalleryImages([...galleryImages, newGalleryImage]);
        
        toast({
          title: "Imagem adicionada",
          description: "A imagem foi adicionada à galeria com sucesso",
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

  const handleDeleteGalleryImage = async (id: number) => {
    try {
      const imageToDelete = galleryImages.find(img => img.id === id);
      if (!imageToDelete) return;
      
      // Delete from Supabase
      await deleteGalleryImage(imageToDelete.src);
      
      setGalleryImages(galleryImages.filter(img => img.id !== id));
      
      toast({
        title: "Imagem removida",
        description: "A imagem foi removida da galeria com sucesso",
      });
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      toast({
        title: "Erro ao remover imagem",
        description: "Ocorreu um erro ao remover a imagem da galeria",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGalleryImage = async () => {
    if (!editingImage) return;
    
    try {
      // Update in Supabase
      await updateGalleryImage({
        src: editingImage.src,
        alt: editingImage.alt
      });
      
      setGalleryImages(galleryImages.map(img => 
        img.id === editingImage.id ? editingImage : img
      ));
      
      setEditingImage(null);
      
      toast({
        title: "Imagem atualizada",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Error updating gallery image:', error);
      toast({
        title: "Erro ao atualizar imagem",
        description: "Ocorreu um erro ao atualizar a imagem da galeria",
        variant: "destructive",
      });
    }
  };

  const updateDisplayOrder = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = galleryImages.findIndex(img => img.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= galleryImages.length) return;
    
    const updatedImages = [...galleryImages];
    const temp = updatedImages[currentIndex];
    updatedImages[currentIndex] = updatedImages[newIndex];
    updatedImages[newIndex] = temp;
    
    // Update display_order in the database
    try {
      await updateGalleryImageOrder(galleryImages[currentIndex].src, newIndex);
      await updateGalleryImageOrder(galleryImages[newIndex].src, currentIndex);
      
      setGalleryImages(updatedImages);
    } catch (error) {
      console.error('Error updating display order:', error);
      toast({
        title: "Erro ao reordenar imagens",
        description: "Ocorreu um erro ao atualizar a ordem das imagens",
        variant: "destructive",
      });
    }
  };

  return {
    isLoading,
    uploading,
    editingImage,
    setEditingImage,
    handleAddGalleryImage,
    handleDeleteGalleryImage,
    handleUpdateGalleryImage,
    updateDisplayOrder
  };
};
