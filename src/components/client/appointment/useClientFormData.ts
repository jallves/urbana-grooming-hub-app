
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
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0; // Não pode ser domingo
  }, 'Não atendemos aos domingos'),
  time: z.string().min(1, 'Horário é obrigatório')
    .refine((time) => {
      const [hours] = time.split(':').map(Number);
      return hours >= 9 && hours < 20;
    }, 'Horário deve ser entre 09h e 20h'),
  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof formSchema>;

export const useClientFormData = (defaultDate: Date = new Date(), clientId?: string) => {
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

  // Fetch services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      console.log('🔍 Buscando serviços...');
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('❌ Erro ao buscar serviços:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Serviços encontrados:', data?.length || 0);
      return data as Service[];
    },
  });

  // Fetch staff members (barbeiros) da tabela staff
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      console.log('🔍 Buscando barbeiros da tabela staff...');
      
      try {
        const { data, error } = await supabase
          .from('staff')
          .select(`
            id,
            name,
            email,
            phone,
            role,
            specialties,
            experience,
            image_url,
            is_active,
            commission_rate,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
          .order('name');
        
        if (error) {
          console.error('❌ Erro ao buscar barbeiros:', error);
          throw new Error(error.message);
        }
        
        console.log('✅ Barbeiros encontrados:', data?.length || 0);
        return data as StaffMember[];
      } catch (error) {
        console.error('❌ Erro na busca de barbeiros:', error);
        throw error;
      }
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
