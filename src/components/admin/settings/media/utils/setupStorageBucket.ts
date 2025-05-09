
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const setupStaffPhotosBucket = async () => {
  try {
    // Check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('staff-photos');
    
    if (bucketError) {
      console.error('Error checking bucket:', bucketError);
      
      if (bucketError.statusCode === '404') {
        console.log('Bucket does not exist. The migration should have created it.');
        toast.info('Inicializando bucket para fotos dos profissionais...');
      }
      return;
    }
    
    console.log('Staff photos bucket verified:', bucketData);
    toast.success('Bucket para fotos de profissionais verificado com sucesso');
  } catch (error) {
    console.error('Error setting up staff photos bucket:', error);
  }
};
