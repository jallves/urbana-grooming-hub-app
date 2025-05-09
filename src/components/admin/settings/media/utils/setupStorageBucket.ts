
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const setupStaffPhotosBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'staff-photos');
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { data, error } = await supabase.storage.createBucket('staff-photos', {
        public: true, // Make it public so images can be accessed without authentication
        fileSizeLimit: 5242880 // 5MB limit
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        toast.error('Erro ao criar bucket para fotos dos profissionais');
      } else {
        console.log('Staff photos bucket created:', data);
        toast.success('Bucket para fotos dos profissionais criado com sucesso');
      }
    }
  } catch (error) {
    console.error('Error setting up staff photos bucket:', error);
  }
};
