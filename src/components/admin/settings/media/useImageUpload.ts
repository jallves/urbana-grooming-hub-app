
import { useUploadState } from './hooks/useUploadState';
import { uploadFileToStorage } from './api/storageApi';
import { setupStaffPhotosBucket } from './utils/setupStorageBucket';

/**
 * Hook for handling image uploads to Supabase Storage
 */
export const useImageUpload = () => {
  const { uploading, setUploading, handleUploadError } = useUploadState();

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    setUploading(true);
    console.log(`Starting upload to bucket: ${bucket}, path: ${path}`);
    
    try {
      // Setup bucket first if it's staff-photos
      if (bucket === 'staff-photos') {
        const bucketReady = await setupStaffPhotosBucket();
        if (!bucketReady) {
          throw new Error('Não foi possível configurar o bucket de storage');
        }
      }
      
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
