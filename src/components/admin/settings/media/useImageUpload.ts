
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (
    file: File, 
    folder: string = 'gallery',
    bucketName: string = 'images'
  ): Promise<string> => {
    try {
      setUploading(true);
      
      console.log(`🚀 Iniciando upload para bucket: ${bucketName}, pasta: ${folder}`);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log(`📁 Nome do arquivo: ${fileName}`);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use: JPG, PNG, GIF ou WebP');
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
      }
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw new Error(`Erro no upload: ${error.message}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado do upload');
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      const publicUrl = publicUrlData.publicUrl;
      console.log('✅ Upload bem-sucedido, URL:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('💥 Erro no uploadFile:', error);
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
