
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStaffStorage = () => {
  const [bucketInitialized, setBucketInitialized] = useState(false);
  
  useEffect(() => {
    const initializeBucket = async () => {
      try {
        // First check if bucket exists
        const { data, error } = await supabase.storage.getBucket('staff-photos');
        
        if (error) {
          // Use error message instead of statusCode for checking
          if (error.message?.includes('Bucket not found')) {
            console.log('Staff photos bucket does not exist. Creating it now...');
            
            // Create the bucket if it doesn't exist
            const { error: createError } = await supabase.storage.createBucket('staff-photos', {
              public: true,
              fileSizeLimit: 10485760, // 10MB
              allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
            });
            
            if (createError) {
              console.error('Error creating staff photos bucket:', createError);
              toast.error('Erro ao criar o bucket para fotos dos profissionais');
              return;
            }
            
            console.log('Staff photos bucket created successfully');
            toast.success('Bucket para fotos dos profissionais criado com sucesso');
            setBucketInitialized(true);
          } else {
            console.error('Error checking bucket:', error);
            toast.error('Erro ao verificar o bucket para fotos dos profissionais');
          }
          return;
        }
        
        console.log('Staff photos bucket already exists:', data);
        setBucketInitialized(true);
        toast.success('Bucket para fotos dos profissionais inicializado');
      } catch (error) {
        console.error('Error setting up staff photos bucket:', error);
        toast.error('Erro ao configurar o bucket para fotos dos profissionais');
      }
    };
    
    initializeBucket();
  }, []);
  
  return { bucketInitialized };
};
