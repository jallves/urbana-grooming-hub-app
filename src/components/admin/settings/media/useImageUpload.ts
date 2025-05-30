
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { ensureStorageBucket, getPublicUrl } from './utils/storageUtils';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (
    file: File, 
    folder: string = 'images',
    bucketName: string = 'images'
  ): Promise<string> => {
    try {
      setUploading(true);
      
      // Ensure bucket exists
      const bucketReady = await ensureStorageBucket(bucketName);
      if (!bucketReady) {
        throw new Error('Não foi possível configurar o storage');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log(`Uploading file to: ${bucketName}/${fileName}`);
      
      // Upload file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Erro no upload: ${error.message}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado do upload');
      }

      // Get public URL
      const publicUrl = getPublicUrl(bucketName, data.path);
      console.log('Upload successful, public URL:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFile,
    uploading
  };
};
