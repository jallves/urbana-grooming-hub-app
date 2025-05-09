
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useImageUpload } from '@/components/admin/settings/media/useImageUpload';
import { StaffFormData } from '@/types/staff';

interface StaffFormProps {
  staffId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const staffFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }).nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  image_url: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

const StaffForm: React.FC<StaffFormProps> = ({ staffId, onCancel, onSuccess }) => {
  const isEditing = !!staffId;
  const { uploadFile, uploading } = useImageUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

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
  
  const { formState } = form;
  const { isSubmitting } = formState;

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

  if (isEditing && isLoadingStaff) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const currentImageUrl = form.watch('image_url');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do profissional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input placeholder="E-mail do profissional" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="Telefone do profissional" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Função</FormLabel>
                <FormControl>
                  <Input placeholder="Função do profissional" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>
                  Ex: Barbeiro, Cabeleireiro, Manicure, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experiência</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: +5 anos" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>
                  Tempo de experiência do profissional
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foto do profissional</FormLabel>
              <div className="space-y-4">
                {currentImageUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={currentImageUrl} 
                      alt="Imagem de perfil" 
                      className="h-32 w-32 object-cover rounded-full border-2 border-urbana-gold"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="flex-1"
                    onChange={handleFileChange}
                  />
                  <input type="hidden" {...field} value={field.value || ''} />
                </div>
              </div>
              <FormDescription>
                Escolha uma foto para o perfil do profissional
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativo</FormLabel>
                <FormDescription>
                  Profissional disponível para agendamentos
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || uploading || uploadProgress}
          >
            {(isSubmitting || uploading || uploadProgress) && 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            }
            {isEditing ? 'Salvar Alterações' : 'Criar Profissional'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StaffForm;
