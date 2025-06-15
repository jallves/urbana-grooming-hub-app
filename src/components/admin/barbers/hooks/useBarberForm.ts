
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
    },
  });

  const [isEditing, setIsEditing] = useState(!!barberId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (barberId) {
      // Buscar dados na staff (não barbers)
      supabase
        .from('staff')
        .select('*')
        .eq('id', barberId)
        .single()
        .then(({ data, error }) => {
          if (data) {
            // Remover role (vai ser fixo)
            const { role, ...rest } = data;
            form.reset(rest);
          }
        });
    }
    // eslint-disable-next-line
  }, [barberId]);
  
  const onSubmit = async (data: BarberFormValues) => {
    setIsSubmitting(true);

    const basePayload = {
      ...data,
      role: 'barber',
      name: data.name ?? '',
    };
    const payload = cleanPayload(basePayload);

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

  return {
    form,
    isEditing,
    isSubmitting,
    onSubmit,
  };
}
