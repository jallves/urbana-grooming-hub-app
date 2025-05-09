
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from '@/types/settings';
import { supabase } from '@/integrations/supabase/client';

export const useImageUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    setUploading(true);
    try {
      console.log(`Uploading file to bucket ${bucket}, path ${path}`);
      
      // Generate a unique file name to avoid overwrites
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;
      
      // Upload file to Supabase Storage
      const { error, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      console.log("Upload successful:", data);
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da imagem: " + (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
