
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useImageUpload } from '@/components/admin/settings/media/useImageUpload';
import { StaffFormData } from '@/types/staff';

export const staffFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }).nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  image_url: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

export function useStaffForm(staffId: string | null, onSuccess: () => void) {
  const isEditing = !!staffId;
  const { uploadFile, uploading } = useImageUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Fetch staff data if editing
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: async () => {
      if (!staffId) return null;
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: '',
      is_active: true,
      image_url: '',
      experience: '',
    },
    values: staffData || undefined,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadProfileImage = async (): Promise<string | null> => {
    if (!selectedFile) return form.getValues().image_url || null;
    
    try {
      setUploadProgress(true);
      console.log('Uploading profile image to staff-photos/profiles');
      const imageUrl = await uploadFile(selectedFile, 'staff-photos', 'profiles');
      console.log('Image uploaded successfully:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da foto');
      return null;
    } finally {
      setUploadProgress(false);
    }
  };

  const onSubmit = async (values: StaffFormValues) => {
    try {
      // Upload image if selected
      const imageUrl = await uploadProfileImage();
      
      // Ensure name is provided (required by database)
      if (!values.name) {
        toast.error('Nome é obrigatório');
        return;
      }
      
      // Update form values with image URL if available
      const staffData = {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        role: values.role || null,
        is_active: values.is_active,
        image_url: imageUrl || values.image_url || null,
        experience: values.experience || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('staff')
          .update(staffData)
          .eq('id', staffId);

        if (error) {
          console.error('Error updating staff:', error);
          throw error;
        }
        toast.success('Profissional atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([staffData]);

        if (error) {
          console.error('Error creating staff:', error);
          throw error;
        }
        toast.success('Profissional criado com sucesso!');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast.error('Erro ao salvar profissional', {
        description: (error as Error).message
      });
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
    isSubmitting: form.formState.isSubmitting,
  };
}
