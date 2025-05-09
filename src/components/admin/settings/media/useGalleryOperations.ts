
import { useState, useEffect } from 'react';
import { GalleryImage } from '@/types/settings';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useImageUpload } from './useImageUpload';

export const useGalleryOperations = (
  galleryImages: GalleryImage[],
  setGalleryImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>
) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useImageUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  // Fetch gallery images from Supabase
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          const formattedData: GalleryImage[] = data.map(item => ({
            id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
            src: item.src,
            alt: item.alt
          }));
          setGalleryImages(formattedData);
        }
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

    fetchGalleryImages();
  }, [setGalleryImages, toast]);

  const handleAddGalleryImage = async (
    newImage: { src: string; alt: string },
    galleryUpload: { file: File; previewUrl: string } | null
  ) => {
    if (!newImage.alt) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição da imagem é obrigatória",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      let imageUrl = newImage.src;
      
      // Upload file if provided
      if (galleryUpload) {
        imageUrl = await uploadFile(galleryUpload.file, 'gallery', 'images');
      }
      
      if (!imageUrl) {
        toast({
          title: "Imagem obrigatória",
          description: "Adicione uma URL de imagem ou faça upload de um arquivo",
          variant: "destructive",
        });
        return false;
      }
      
      // Insert new gallery image into Supabase
      const { data, error } = await supabase
        .from('gallery_images')
        .insert({
          src: imageUrl,
          alt: newImage.alt,
          display_order: galleryImages.length,
          is_active: true
        })
        .select();
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('src', imageToDelete.src);
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('gallery_images')
        .update({
          src: editingImage.src,
          alt: editingImage.alt
        })
        .eq('src', editingImage.src);
      
      if (error) throw error;
      
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
      const batch = [];
      
      batch.push(
        supabase
          .from('gallery_images')
          .update({ display_order: newIndex })
          .eq('src', galleryImages[currentIndex].src)
      );
      
      batch.push(
        supabase
          .from('gallery_images')
          .update({ display_order: currentIndex })
          .eq('src', galleryImages[newIndex].src)
      );
      
      await Promise.all(batch);
      
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
