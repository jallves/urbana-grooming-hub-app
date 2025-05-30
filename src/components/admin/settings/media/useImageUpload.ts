
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
      
      console.log(`🚀 Iniciando upload para bucket: ${bucketName}`);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log(`📁 Nome do arquivo: ${fileName}`);
      
      // Check if bucket exists, if not create it
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Erro ao listar buckets:', listError);
        throw new Error(`Erro ao acessar storage: ${listError.message}`);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log(`📦 Criando bucket: ${bucketName}`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (createError) {
          console.error('❌ Erro ao criar bucket:', createError);
          throw new Error(`Erro ao criar bucket: ${createError.message}`);
        }
      }
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
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
