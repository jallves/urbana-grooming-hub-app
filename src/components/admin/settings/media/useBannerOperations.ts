
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { BannerImage } from '@/types/settings';
import { useImageUpload } from '@/components/admin/settings/media/useImageUpload';

export const useBannerOperations = (bannerImages: BannerImage[], setBannerImages: React.Dispatch<React.SetStateAction<BannerImage[]>>) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useImageUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerImage | null>(null);
  
  // Fetch banner images from Supabase
  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('banner_images')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          const formattedData: BannerImage[] = data.map(item => ({
            id: parseInt(item.id.toString().replace(/-/g, '').substring(0, 8), 16),
            imageUrl: item.image_url,
            title: item.title,
            subtitle: item.subtitle,
            description: item.description || ''
          }));
          setBannerImages(formattedData);
        }
      } catch (error) {
        console.error('Error fetching banner images:', error);
        toast({
          title: "Erro ao carregar banners",
          description: "Não foi possível carregar os banners do banco de dados",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBannerImages();
  }, [setBannerImages, toast]);

  const handleAddBanner = async (newBanner: Omit<BannerImage, 'id'>, bannerUpload: { file: File, previewUrl: string } | null) => {
    if (!newBanner.title) {
      toast({
        title: "Campo obrigatório",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      let imageUrl = newBanner.imageUrl;
      
      // Upload file if provided
      if (bannerUpload) {
        try {
          console.log("Uploading banner image to Supabase Storage");
          imageUrl = await uploadFile(bannerUpload.file, 'banners', 'images');
          console.log("Banner image upload successful, URL:", imageUrl);
        } catch (uploadError: any) {
          console.error("Banner upload error:", uploadError);
          
          // Show more detailed error message to help debugging
          let errorMessage = "Não foi possível fazer o upload da imagem do banner";
          if (uploadError.message) {
            errorMessage += ": " + uploadError.message;
          }
          
          toast({
            title: "Erro no upload",
            description: errorMessage,
            variant: "destructive",
          });
          return false;
        }
      }
      
      if (!imageUrl) {
        toast({
          title: "Imagem obrigatória",
          description: "Adicione uma URL de imagem ou faça upload de um arquivo",
          variant: "destructive",
        });
        return false;
      }
      
      // Insert new banner into Supabase
      const { data, error } = await supabase
        .from('banner_images')
        .insert({
          image_url: imageUrl,
          title: newBanner.title,
          subtitle: newBanner.subtitle,
          description: newBanner.description,
          display_order: bannerImages.length,
          is_active: true
        })
        .select();
      
      if (error) {
        console.error("Error inserting banner record:", error);
        throw error;
      }
      
      if (data && data[0]) {
        const newBannerWithId: BannerImage = {
          id: parseInt(data[0].id.toString().replace(/-/g, '').substring(0, 8), 16),
          imageUrl: data[0].image_url,
          title: data[0].title,
          subtitle: data[0].subtitle,
          description: data[0].description || ''
        };
        
        setBannerImages([...bannerImages, newBannerWithId]);
        toast({
          title: "Banner adicionado",
          description: "O novo banner foi adicionado com sucesso",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error adding banner:', error);
      toast({
        title: "Erro ao adicionar banner",
        description: "Ocorreu um erro ao adicionar o banner: " + error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (bannerImages.length <= 1) {
      toast({
        title: "Operação não permitida",
        description: "É necessário manter pelo menos um banner",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Find the UUID in the original format from our database
      const bannerToDelete = bannerImages.find(img => img.id === id);
      if (!bannerToDelete) return;
      
      // Delete from Supabase by matching imageUrl since we don't have the original UUID
      const { error } = await supabase
        .from('banner_images')
        .delete()
        .eq('image_url', bannerToDelete.imageUrl);
      
      if (error) throw error;
      
      setBannerImages(bannerImages.filter(img => img.id !== id));
      toast({
        title: "Banner removido",
        description: "O banner foi removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        title: "Erro ao remover banner",
        description: "Ocorreu um erro ao remover o banner",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    
    try {
      // Find the banner in Supabase by matching imageUrl
      const { data, error } = await supabase
        .from('banner_images')
        .update({
          image_url: editingBanner.imageUrl,
          title: editingBanner.title,
          subtitle: editingBanner.subtitle,
          description: editingBanner.description
        })
        .eq('image_url', editingBanner.imageUrl)
        .select();
      
      if (error) throw error;
      
      setBannerImages(bannerImages.map(img => 
        img.id === editingBanner.id ? editingBanner : img
      ));
      
      setEditingBanner(null);
      toast({
        title: "Banner atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        title: "Erro ao atualizar banner",
        description: "Ocorreu um erro ao atualizar o banner",
        variant: "destructive",
      });
    }
  };

  return {
    isLoading,
    uploading,
    editingBanner,
    setEditingBanner,
    handleAddBanner,
    handleDeleteBanner,
    handleUpdateBanner
  };
};
