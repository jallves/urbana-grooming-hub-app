
import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path The path within the bucket
 * @returns The public URL of the uploaded file
 */
export const uploadFileToStorage = async (file: File, bucket: string, path: string): Promise<string> => {
  console.log(`Uploading file to bucket ${bucket}, path ${path}`);
  
  // Generate a unique file name to avoid overwrites
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;
  
  // Upload to storage with the correct bucket
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
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
};
