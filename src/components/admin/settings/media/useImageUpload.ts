
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from './types';

export const useImageUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;
      
      // Mock upload for now - in real scenario, you would upload to Supabase
      // const { data, error } = await supabase.storage.from(bucket).upload(filePath, file);
      
      // if (error) throw error;
      
      // const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      // Return mocked URL for now
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da imagem",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
