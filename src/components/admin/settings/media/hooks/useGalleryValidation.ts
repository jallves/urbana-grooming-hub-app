
import { useToast } from "@/hooks/use-toast";

export const useGalleryValidation = () => {
  const { toast } = useToast();
  
  const validateGalleryImage = (alt: string, imageUrl: string) => {
    if (!alt) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição da imagem é obrigatória",
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
  
  return { validateGalleryImage };
};
