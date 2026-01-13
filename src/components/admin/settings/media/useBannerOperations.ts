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
  
  useEffect(() => {
    const loadBannerImages = async () => {
      try {
        setIsLoading(true);
        const formattedData = await fetchBannerImages();
        setBannerImages(formattedData);
      } catch (error) {
        console.error('Error fetching banner images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBannerImages();
  }, [setBannerImages]);

  const handleAddBanner = async (newBanner: Omit<BannerImage, 'id'>, bannerUpload: { file: File, previewUrl: string } | null) => {
    if (!validateBanner(newBanner.title, newBanner.image_url)) return false;
    
    try {
      let imageUrl = newBanner.image_url;
      
      if (bannerUpload) {
        imageUrl = await uploadFile(bannerUpload.file, 'uploads', 'banners');
      }
      
      const data = await createBanner({
        image_url: imageUrl,
        title: newBanner.title,
        subtitle: newBanner.subtitle,
        description: newBanner.description,
        display_order: bannerImages.length
      });
      
      if (data && data.length > 0) {
        const newBannerWithId: BannerImage = {
          id: String(Date.now()),
          image_url: imageUrl,
          title: newBanner.title,
          subtitle: newBanner.subtitle,
          description: newBanner.description,
          button_text: 'Agendar Agora',
          button_link: '/cliente/login',
          is_active: true,
          display_order: bannerImages.length
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
        description: "Ocorreu um erro ao adicionar o banner",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (bannerImages.length <= 1) {
      toast({
        title: "Operação não permitida",
        description: "É necessário manter pelo menos um banner",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const bannerToDelete = bannerImages.find(img => img.id === id);
      if (!bannerToDelete) return;
      
      await deleteBanner(bannerToDelete.image_url);
      
      setBannerImages(bannerImages.filter(img => img.id !== id));
      toast({
        title: "Banner removido",
        description: "O banner foi removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    
    try {
      await updateBanner({
        image_url: editingBanner.image_url,
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
