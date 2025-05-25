
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const setupStaffPhotosBucket = async () => {
  try {
    console.log('Configurando bucket staff-photos...');
    
    // Check if bucket exists by listing all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      toast.error('Erro ao verificar buckets existentes');
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'staff-photos');
    
    if (!bucketExists) {
      console.log('Criando bucket staff-photos...');
      
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('staff-photos', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      });
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        toast.error('Erro ao criar o bucket para fotos dos profissionais', {
          description: createError.message
        });
        return false;
      }
      
      console.log('Bucket staff-photos criado com sucesso');
      toast.success('Bucket para fotos dos profissionais criado com sucesso');
    } else {
      console.log('Bucket staff-photos já existe e está configurado');
      toast.success('Bucket para fotos dos profissionais verificado com sucesso');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao configurar bucket staff-photos:', error);
    toast.error('Erro ao configurar bucket para fotos dos profissionais', {
      description: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return false;
  }
};
