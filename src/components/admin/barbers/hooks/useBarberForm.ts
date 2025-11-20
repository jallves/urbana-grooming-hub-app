
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createBarber, updateBarber } from '@/services/barberService';

export const barberSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  image_url: z.string().optional(),
  specialties: z.string().optional(),
  experience: z.string().optional(),
  commission_rate: z.union([z.number(), z.null()]).optional(),
  is_active: z.boolean().default(true),
  role: z.string().default('barber'),
});

export type BarberFormValues = z.infer<typeof barberSchema>;

function cleanPayload<T extends object>(payload: T) {
  const newObj: any = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) newObj[key] = value;
  });
  return newObj;
}

export function useBarberForm(barberId: string | null, onSuccess: () => void) {
  const form = useForm<BarberFormValues>({
    resolver: zodResolver(barberSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      image_url: '',
      specialties: '',
      experience: '',
      commission_rate: null,
      is_active: true,
      role: 'barber',
    },
  });

  const [isEditing, setIsEditing] = useState(!!barberId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (barberId) {
      supabase
        .from('staff')
        .select('*')
        .eq('id', barberId)
        .single()
        .then(({ data, error }) => {
          if (data) {
            form.reset(data);
          }
        });
    }
    // eslint-disable-next-line
  }, [barberId]);

  const onSubmit = async (data: BarberFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = cleanPayload(data);

      if (barberId) {
        await updateBarber(barberId, payload);
      } else {
        await createBarber(payload);
      }

      toast.success('Barbeiro salvo com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao salvar barbeiro', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para fazer upload de imagem
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido', {
        description: 'Use apenas JPG, PNG ou WEBP'
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O tamanho máximo é 5MB'
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para o bucket
      const { data, error } = await supabase.storage
        .from('barber-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('barber-photos')
        .getPublicUrl(filePath);

      // Atualizar o formulário com a nova URL
      form.setValue('image_url', urlData.publicUrl);

      toast.success('Foto carregada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da foto', {
        description: error.message
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Função para cadastrar/redefinir senha do barbeiro (via e-mail)
  const handlePasswordChange = async (password: string) => {
    const email = form.getValues('email');
    if (!email) {
      toast.error('Insira o e-mail do barbeiro no formulário');
      return;
    }
    setIsPasswordLoading(true);

    let response;
    if (isEditing) {
      // Buscar usuário pelo e-mail: listUsers + local find
      const { data, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
      if (listError) {
        toast.error('Erro ao buscar usuários', { description: listError.message });
        setIsPasswordLoading(false);
        return;
      }
      const user = data?.users?.find((u: any) => u.email === email);
      if (!user) {
        toast.error('Usuário não encontrado para esse e-mail');
        setIsPasswordLoading(false);
        return;
      }

      response = await supabase.auth.admin.updateUserById(user.id, { password });
      if (response.error) {
        toast.error('Erro ao redefinir senha', { description: response.error.message });
      } else {
        toast.success('Senha redefinida com sucesso!');
      }
    } else {
      // Cadastro de novo usuário (envia e-mail, se não existir)
      response = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (response.error) {
        toast.error('Erro ao criar usuário no Auth', { description: response.error.message });
      } else {
        toast.success('Senha cadastrada e e-mail enviado!');
      }
    }
    setIsPasswordLoading(false);
  };

  return {
    form,
    isEditing,
    isSubmitting,
    onSubmit,
    handleImageUpload,
    isUploadingImage,
    handlePasswordChange,
    isPasswordLoading,
  };
}
