
import { useToast } from "@/hooks/use-toast";

export const useBannerValidation = () => {
  const { toast } = useToast();
  
  const validateBanner = (title: string, imageUrl: string) => {
    if (!title) {
      toast({
        title: "Campo obrigatório",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    
    if (!imageUrl) {
      toast({
        title: "Imagem obrigatória",
        description: "Adicione uma URL de imagem ou faça upload de um arquivo",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  return { validateBanner };
};
