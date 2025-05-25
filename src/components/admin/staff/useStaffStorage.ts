
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStaffStorage = () => {
  const [bucketInitialized, setBucketInitialized] = useState(false);
  
  useEffect(() => {
    const initializeBucket = async () => {
      try {
        console.log('Verificando/criando bucket staff-photos...');
        
        // First check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error('Erro ao listar buckets:', listError);
          toast.error('Erro ao verificar buckets existentes');
          return;
        }
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'staff-photos');
        
        if (!bucketExists) {
          console.log('Bucket staff-photos não existe. Criando...');
          
          // Create the bucket if it doesn't exist
          const { error: createError } = await supabase.storage.createBucket('staff-photos', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
          });
          
          if (createError) {
            console.error('Erro ao criar bucket staff-photos:', createError);
            toast.error('Erro ao criar o bucket para fotos dos profissionais', {
              description: createError.message
            });
            return;
          }
          
          console.log('Bucket staff-photos criado com sucesso');
          toast.success('Bucket para fotos dos profissionais criado com sucesso');
        } else {
          console.log('Bucket staff-photos já existe');
          toast.success('Bucket para fotos dos profissionais verificado');
        }
        
        setBucketInitialized(true);
      } catch (error) {
        console.error('Erro ao configurar bucket staff-photos:', error);
        toast.error('Erro ao configurar o bucket para fotos dos profissionais', {
          description: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    };
    
    initializeBucket();
  }, []);
  
  return { bucketInitialized };
};
