import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImageUpload } from '../../settings/media/useImageUpload';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { uploadFile, uploading } = useImageUpload();
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

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchStaff = useCallback(async () => {
    if (!staffId) return;
    
    setIsLoadingStaff(true);
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
  }, [staffId, form]);

  // Load staff data for editing
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    console.log('File selected:', file?.name);
  }, []);

  const onSubmit = useCallback(async (data: StaffFormValues) => {
    try {
      setIsSubmitting(true);
      console.log('Starting form submission...');

      let imageUrl = data.image_url;

      // Upload image if selected
      if (selectedFile) {
        console.log('Uploading new image...');
        setUploadProgress(25);
        
        try {
          const uploadedUrl = await uploadFile(selectedFile, 'staff-photos', 'profiles');
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
            setUploadProgress(100);
            console.log('Image uploaded successfully:', uploadedUrl);
            toast.success('Imagem enviada com sucesso!');
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Erro ao fazer upload da imagem');
          return; // Don't proceed if image upload failed
        }
      }

      // Prepare staff data
      const staffData = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        role: data.role || null,
        is_active: data.is_active,
        image_url: imageUrl || null,
        experience: data.experience || null,
        commission_rate: data.commission_rate || null,
        specialties: data.specialties || null,
      };

      console.log('Saving staff data:', staffData);

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
      console.error('Error saving staff:', error);
      toast.error('Erro ao salvar profissional', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }, [selectedFile, uploadFile, isEditing, staffId, onSuccess]);

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
    uploadFile,
  };
};
