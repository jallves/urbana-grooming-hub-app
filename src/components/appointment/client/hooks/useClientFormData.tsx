
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/appointment';
import { Staff } from '@/types/barber';

const formSchema = z.object({
  client_name: z.string().optional(),
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  staff_id: z.string().min(1, 'Profissional é obrigatório'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  time: z.string().min(1, 'Horário é obrigatório'),
  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof formSchema>;

export const useClientFormData = (clientName: string = '') => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: clientName,
      service_id: '',
      staff_id: '',
      date: undefined,
      time: '',
      notes: '',
    },
  });

  // Fetch services
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['client-services'],
    queryFn: async () => {
      console.log('[useClientFormData] Buscando serviços...');
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('[useClientFormData] Erro ao buscar serviços:', error);
        throw new Error(error.message);
      }
      
      console.log('[useClientFormData] Serviços encontrados:', data);
      return data as Service[];
    },
  });

  // Fetch staff (barbeiros)
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['client-staff'],
    queryFn: async () => {
      console.log('[useClientFormData] Buscando barbeiros...');
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .eq('role', 'barber')
        .order('name');
        
      if (error) {
        console.error('[useClientFormData] Erro ao buscar barbeiros:', error);
        throw new Error(error.message);
      }
      
      console.log('[useClientFormData] Barbeiros encontrados:', data);
      return data as Staff[];
    },
  });

  // Update selected service when service_id changes
  useEffect(() => {
    const serviceId = form.watch('service_id');
    if (services && serviceId) {
      const service = services.find(s => s.id === serviceId);
      setSelectedService(service || null);
      console.log('[useClientFormData] Serviço selecionado:', service);
    }
  }, [form.watch('service_id'), services]);

  const isLoading = isLoadingServices || isLoadingStaff;

  console.log('[useClientFormData] Estado atual:', {
    isLoading,
    servicesCount: services.length,
    staffCount: staffMembers.length,
    selectedService: selectedService?.name
  });

  return {
    form,
    isLoading,
    services,
    staffMembers,
    selectedService,
  };
};
