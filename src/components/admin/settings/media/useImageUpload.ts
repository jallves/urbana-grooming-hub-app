
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from './types';
import { supabase } from '@/integrations/supabase/client';

export const useImageUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    setUploading(true);
    try {
      // Create buckets if they don't exist (this is a no-op if they already exist)
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket(bucket);
      
      // If bucket doesn't exist, create it
      if (bucketError && bucketError.message.includes('not found')) {
        await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
      }

      // Generate a unique file name to avoid overwrites
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;
      
      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get the public URL for the uploaded file
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return data.publicUrl;
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
