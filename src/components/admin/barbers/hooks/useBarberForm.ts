
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const barberSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  image_url: z.string().optional(),
  specialties: z.string().optional(),
  experience: z.string().optional(),
  commission_rate: z.union([z.number(), z.null()]).optional(),
  is_active: z.boolean().default(true),
  role: z.string().default('barber')
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
      role: 'barber'
    },
  });

  const [isEditing, setIsEditing] = useState(!!barberId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

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

    const payload = cleanPayload(data);

    let resp;
    if (barberId) {
      resp = await supabase
        .from('staff')
        .update(payload)
        .eq('id', barberId);
    } else {
      resp = await supabase
        .from('staff')
        .insert([payload]);
    }

    if (resp.error) {
      toast.error('Erro ao salvar barbeiro', { description: resp.error.message });
    } else {
      toast.success('Barbeiro salvo!');
      onSuccess();
    }
    setIsSubmitting(false);
  };

  // Função para cadastrar/redefinir senha do barbeiro (via e-mail)
  const handlePasswordChange = async (password: string) => {
    if (!form.getValues('email')) {
      toast.error('Insira o e-mail do barbeiro no formulário');
      return;
    }
    setIsPasswordLoading(true);
    let response;
    if (isEditing) {
      // Redefine password (só funciona se já é usuário no auth)
      response = await supabase.auth.admin.updateUserByEmail(form.getValues('email'), { password });
      if (response.error) {
        toast.error('Erro ao redefinir senha', { description: response.error.message });
      } else {
        toast.success('Senha redefinida com sucesso!');
      }
    } else {
      // Cadastro de novo usuário (envia e-mail, se não existir)
      response = await supabase.auth.admin.createUser({
        email: form.getValues('email'),
        password,
        email_confirm: true
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
    handlePasswordChange,
    isPasswordLoading,
  };
}
