
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service, StaffMember } from '@/types/appointment';

const formSchema = z.object({
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  staff_id: z.string().min(1, 'Profissional é obrigatório'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }).refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Data não pode ser no passado')
  .refine((date) => {
    // Domingo agora funciona (09:00-13:00)
    return true;
  }, 'Data inválida'),
  time: z.string().min(1, 'Horário é obrigatório')
    .refine((time) => {
      const [hours] = time.split(':').map(Number);
      return hours >= 9 && hours < 20;
    }, 'Horário deve ser entre 09h e 20h'),
  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof formSchema>;

export const useClientAppointmentFormData = (defaultDate: Date = new Date(), clientId?: string) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_id: '',
      staff_id: '',
      date: defaultDate,
      time: '',
      notes: '',
    },
  });

  // Fetch services do painel_servicos
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['painel_servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .eq('is_active', true)
        .gt('preco', 0)
        .order('nome');
      
      if (error) throw new Error(error.message);
      return (data || []).map(s => ({
        id: s.id,
        name: s.nome,
        price: Number(s.preco),
        duration: s.duracao,
        description: s.descricao,
        is_active: s.is_active
      })) as Service[];
    },
  });

  // Fetch staff do painel_barbeiros
  const { data: staffMembers, isLoading: isLoadingStaff, error: staffError } = useQuery({
    queryKey: ['painel_barbeiros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('is_active', true)
        .order('nome');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return (data || []).map(b => ({
        id: b.id,
        name: b.nome,
        email: b.email,
        phone: b.telefone,
        image_url: b.image_url,
        specialties: b.specialties,
        experience: b.experience,
        commission_rate: b.commission_rate,
        is_active: b.is_active,
        role: b.role
      })) as StaffMember[];
    },
  });

  // Update selected service when service_id changes
  useEffect(() => {
    const serviceId = form.watch('service_id');
    if (services && serviceId) {
      const service = services.find(s => s.id === serviceId);
      setSelectedService(service || null);
    }
  }, [form.watch('service_id'), services]);

  const isLoading = isLoadingServices || isLoadingStaff;

  return {
    form,
    isLoading,
    services: services || [],
    staffMembers: staffMembers || [],
    selectedService,
  };
};
