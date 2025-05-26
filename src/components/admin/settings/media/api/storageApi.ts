
import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a file to Supabase Storage with optimized error handling
 */
export const uploadFileToStorage = async (file: File, bucket: string, path: string): Promise<string> => {
  console.log(`Uploading file to bucket ${bucket}, path ${path}`);
  
  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo não suportado. Use: JPG, PNG, GIF ou WebP');
  }
  
  // Generate a unique file name to avoid overwrites
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;
  
  try {
    // Upload to storage with optimized settings
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite, create new files
        contentType: file.type
      });
    
    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }
    
    console.log("Upload successful, data:", uploadData);
    
    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log("Public URL:", publicUrlData.publicUrl);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Storage API error:', error);
    throw error;
  }
};
