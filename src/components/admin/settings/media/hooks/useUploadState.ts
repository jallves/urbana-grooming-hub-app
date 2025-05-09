
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for managing the upload state and errors
 */
export const useUploadState = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  const handleUploadError = (error: Error) => {
    console.error('Error uploading file:', error);
    toast({
      title: "Erro no upload",
      description: "Não foi possível fazer o upload da imagem: " + error.message,
      variant: "destructive",
    });
    throw error;
  };
  
  return { uploading, setUploading, handleUploadError };
};
