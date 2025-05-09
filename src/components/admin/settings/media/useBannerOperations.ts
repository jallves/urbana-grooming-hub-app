
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { BannerImage } from '@/types/settings';
import { useImageUpload } from '@/components/admin/settings/media/useImageUpload';
import { fetchBannerImages, createBanner, updateBanner, deleteBanner } from './api/bannerApi';
import { useBannerValidation } from './hooks/useBannerValidation';

export const useBannerOperations = (
  bannerImages: BannerImage[],
  setBannerImages: React.Dispatch<React.SetStateAction<BannerImage[]>>
) => {
  const { toast } = useToast();
  const { uploadFile, uploading } = useImageUpload();
  const { validateBanner } = useBannerValidation();
  const [isLoading, setIsLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerImage | null>(null);
  
  // Fetch banner images from Supabase
  useEffect(() => {
    const loadBannerImages = async () => {
      try {
        setIsLoading(true);
        const formattedData = await fetchBannerImages();
        setBannerImages(formattedData);
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

    loadBannerImages();
  }, [setBannerImages, toast]);

  const handleAddBanner = async (newBanner: Omit<BannerImage, 'id'>, bannerUpload: { file: File, previewUrl: string } | null) => {
    // Validate input
    if (!validateBanner(newBanner.title, newBanner.imageUrl)) return false;
    
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
          throw new Error(uploadError.message || "Erro ao fazer upload da imagem");
        }
      }
      
      // Insert new banner into Supabase
      const data = await createBanner({
        image_url: imageUrl,
        title: newBanner.title,
        subtitle: newBanner.subtitle,
        description: newBanner.description,
        display_order: bannerImages.length
      });
      
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
      throw error;
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
      // Find the banner with the given id
      const bannerToDelete = bannerImages.find(img => img.id === id);
      if (!bannerToDelete) return;
      
      // Delete from Supabase using the imageUrl
      await deleteBanner(bannerToDelete.imageUrl);
      
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
      // Update the banner in Supabase
      await updateBanner({
        image_url: editingBanner.imageUrl,
        title: editingBanner.title,
        subtitle: editingBanner.subtitle,
        description: editingBanner.description
      });
      
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
