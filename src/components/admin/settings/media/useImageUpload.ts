
import { useUploadState } from './hooks/useUploadState';
import { uploadFileToStorage } from './api/storageApi';

/**
 * Hook for handling image uploads to Supabase Storage
 */
export const useImageUpload = () => {
  const { uploading, setUploading, handleUploadError } = useUploadState();

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    setUploading(true);
    console.log(`Starting upload to bucket: ${bucket}, path: ${path}`);
    
    try {
      const publicUrl = await uploadFileToStorage(file, bucket, path);
      console.log(`Upload completed successfully, URL: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('Error in useImageUpload:', error);
      handleUploadError(error as Error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
