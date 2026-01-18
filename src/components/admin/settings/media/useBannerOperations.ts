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
        console.log('🖼️ [useBannerOperations] Banners carregados:', formattedData.length);
        setBannerImages(formattedData);
      } catch (error) {
        console.error('❌ [useBannerOperations] Erro ao buscar banners:', error);
        toast({
          title: "Erro ao carregar banners",
          description: "Não foi possível carregar os banners",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBannerImages();
  }, [setBannerImages, toast]);

  const handleAddBanner = async (newBanner: Omit<BannerImage, 'id'>, bannerUpload: { file: File, previewUrl: string } | null) => {
    // Validar: precisa de título e imagem (URL ou upload)
    if (!newBanner.title || (!newBanner.image_url && !bannerUpload)) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o título e selecione uma imagem",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      setIsLoading(true);
      let imageUrl = newBanner.image_url;
      
      // Se tem arquivo para upload, faz o upload primeiro
      if (bannerUpload) {
        console.log('📤 [useBannerOperations] Fazendo upload da imagem...');
        imageUrl = await uploadFile(bannerUpload.file, 'banners', 'staff-photos');
        console.log('✅ [useBannerOperations] Upload concluído:', imageUrl);
      }
      
      const data = await createBanner({
        image_url: imageUrl,
        title: newBanner.title,
        subtitle: newBanner.subtitle || '',
        description: newBanner.description,
        button_text: newBanner.button_text,
        button_link: newBanner.button_link,
        display_order: bannerImages.length
      });
      
      if (data && data.length > 0) {
        const createdBanner: BannerImage = {
          id: data[0].id,
          image_url: data[0].image_url,
          title: data[0].title,
          subtitle: data[0].subtitle || '',
          description: data[0].description || '',
          button_text: data[0].button_text || 'Agendar Agora',
          button_link: data[0].button_link || '/painel-cliente/login',
          is_active: data[0].is_active,
          display_order: data[0].display_order
        };
        
        setBannerImages([...bannerImages, createdBanner]);
        toast({
          title: "Banner adicionado",
          description: "O novo banner foi adicionado com sucesso",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('❌ [useBannerOperations] Erro ao adicionar banner:', error);
      toast({
        title: "Erro ao adicionar banner",
        description: error.message || "Ocorreu um erro ao adicionar o banner",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      const bannerToDelete = bannerImages.find(img => img.id === id);
      if (!bannerToDelete) return;
      
      // Deletar pelo ID do banner (não pela URL)
      await deleteBanner(id);
      
      setBannerImages(bannerImages.filter(img => img.id !== id));
      toast({
        title: "Banner removido",
        description: "O banner foi removido com sucesso",
      });
    } catch (error) {
      console.error('❌ [useBannerOperations] Erro ao deletar banner:', error);
      toast({
        title: "Erro ao remover banner",
        description: "Ocorreu um erro ao remover o banner",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    
    try {
      setIsLoading(true);
      await updateBanner({
        id: editingBanner.id,
        image_url: editingBanner.image_url,
        title: editingBanner.title,
        subtitle: editingBanner.subtitle,
        description: editingBanner.description,
        button_text: editingBanner.button_text,
        button_link: editingBanner.button_link,
        is_active: editingBanner.is_active
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
      console.error('❌ [useBannerOperations] Erro ao atualizar banner:', error);
      toast({
        title: "Erro ao atualizar banner",
        description: "Ocorreu um erro ao atualizar o banner",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
