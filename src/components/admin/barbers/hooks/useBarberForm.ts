
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

export const barberSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().optional(),
  phone: z.string().optional(),
  image_url: z.string().optional(),
  specialties: z.string().optional(),
  experience: z.string().optional(),
  commission_rate: z.number().nullable().optional(),
  is_active: z.boolean().default(true),
  role: z.string().default('barber'),
});

export type BarberFormValues = z.infer<typeof barberSchema>;

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

  useEffect(() => {
    if (barberId) {
      supabase.from('staff').select('*').eq('id', barberId).single().then(({ data, error }) => {
        if (data) {
          form.reset(data);
        }
      });
    }
    // eslint-disable-next-line
  }, [barberId]);
  
  const onSubmit = async (data: BarberFormValues) => {
    setIsSubmitting(true);
    let resp;

    if (barberId) {
      resp = await supabase.from('staff').update({
        ...data,
        role: 'barber',
      }).eq('id', barberId);
    } else {
      // Guarantee required fields and correct shape:
      resp = await supabase.from('staff').insert([{
        ...data,
        name: data.name, // ensure name present, required by schema
        role: 'barber',
        commission_rate: data.commission_rate ?? null,
        is_active: data.is_active,
        email: data.email || null,
        phone: data.phone || null,
        image_url: data.image_url || null,
        specialties: data.specialties || null,
        experience: data.experience || null,
      }]);
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
    onSubmit
  };
}

