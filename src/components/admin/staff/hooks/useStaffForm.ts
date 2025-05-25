
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const staffFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
  is_active: z.boolean().default(true),
  image_url: z.string().optional(),
  experience: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  specialties: z.string().optional(),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

export const useStaffForm = (staffId: string | null, onSuccess: () => void, defaultRole?: string) => {
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(staffId);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: defaultRole || '',
      is_active: true,
      image_url: '',
      experience: '',
      commission_rate: 0,
      specialties: '',
    },
  });

  // Load staff data for editing
  useEffect(() => {
    if (staffId) {
      setIsLoadingStaff(true);
      const fetchStaff = async () => {
        try {
          const { data, error } = await supabase
            .from('staff')
            .select('*')
            .eq('id', staffId)
            .single();

          if (error) throw error;

          if (data) {
            form.reset({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              role: data.role || '',
              is_active: data.is_active,
              image_url: data.image_url || '',
              experience: data.experience || '',
              commission_rate: data.commission_rate || 0,
              specialties: data.specialties || '',
            });
          }
        } catch (error) {
          console.error('Erro ao carregar profissional:', error);
          toast.error('Erro ao carregar dados do profissional');
        } finally {
          setIsLoadingStaff(false);
        }
      };

      fetchStaff();
    }
  }, [staffId, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'staff-photos');
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket('staff-photos', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        });
        
        if (createError) {
          throw createError;
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `staff/${fileName}`;

      setUploadProgress(50);

      const { error: uploadError } = await supabase.storage
        .from('staff-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(75);

      const { data } = supabase.storage
        .from('staff-photos')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: StaffFormValues) => {
    try {
      setIsSubmitting(true);

      let imageUrl = data.image_url;

      // Upload image if selected
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Ensure the staffData object matches the expected Supabase schema
      const staffData = {
        name: data.name, // Required field
        email: data.email || null,
        phone: data.phone || null,
        role: data.role || null,
        is_active: data.is_active,
        image_url: imageUrl || null,
        experience: data.experience || null,
        commission_rate: data.commission_rate || null,
        specialties: data.specialties || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('staff')
          .update(staffData)
          .eq('id', staffId);

        if (error) throw error;

        toast.success('Profissional atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('staff')
          .insert(staffData);

        if (error) throw error;

        toast.success('Profissional criado com sucesso!');
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
      toast.error('Erro ao salvar profissional', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isEditing,
    isLoadingStaff,
    handleFileChange,
    selectedFile,
    uploading,
    uploadProgress,
    isSubmitting,
  };
};
