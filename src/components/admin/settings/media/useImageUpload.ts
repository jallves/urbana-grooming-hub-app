
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
      
      // Create signed URL for upload (bypasses RLS)
      const { data: signedURLData, error: signedURLError } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(filePath);
      
      if (signedURLError) {
        console.error('Error creating signed URL:', signedURLError);
        throw new Error(`Erro ao criar URL assinada: ${signedURLError.message}`);
      }
      
      // Upload the file using the signed URL
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(signedURLData.path, signedURLData.token, file);
      
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message || 'Erro desconhecido durante o upload'}`);
      }
      
      console.log("Upload successful");
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      console.log("Public URL:", publicUrlData.publicUrl);
      
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
