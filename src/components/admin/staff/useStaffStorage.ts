
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStaffStorage = () => {
  const [bucketInitialized, setBucketInitialized] = useState(false);
  
  useEffect(() => {
    const checkBucketExists = async () => {
      try {
        // Check if bucket exists
        const { data, error } = await supabase.storage.getBucket('staff-photos');
        
        if (error) {
          // Use error message instead of statusCode for checking
          if (error.message?.includes('Bucket not found')) {
            console.error('Staff photos bucket does not exist:', error);
            toast.error('Erro ao acessar o bucket para fotos dos profissionais');
          } else {
            console.error('Error checking bucket:', error);
          }
          return;
        }
        
        console.log('Staff photos bucket exists:', data);
        setBucketInitialized(true);
        toast.success('Bucket para fotos dos profissionais inicializado');
      } catch (error) {
        console.error('Error setting up staff photos bucket:', error);
      }
    };
    
    checkBucketExists();
  }, []);
  
  return { bucketInitialized };
};
