
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

  // Buscar serviços - agora com acesso público através das políticas RLS
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['public-services'],
    queryFn: async () => {
      console.log('[useClientFormData] Buscando serviços públicos...');
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('[useClientFormData] Erro ao buscar serviços:', error);
        throw new Error(`Erro ao carregar serviços: ${error.message}`);
      }
      
      console.log('[useClientFormData] Serviços encontrados:', data);
      return data as Service[];
    },
  });

  // Buscar barbeiros da tabela staff - agora com acesso público através das políticas RLS
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['public-staff'],
    queryFn: async () => {
      console.log('[useClientFormData] Buscando barbeiros da tabela staff...');
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, email, phone, image_url, specialties, experience, commission_rate, is_active, role, created_at, updated_at')
        .eq('is_active', true)
        .eq('role', 'barber')
        .order('name');
        
      if (error) {
        console.error('[useClientFormData] Erro ao buscar barbeiros da tabela staff:', error);
        throw new Error(`Erro ao carregar barbeiros: ${error.message}`);
      }
      
      console.log('[useClientFormData] Barbeiros encontrados na tabela staff:', data);
      console.log('[useClientFormData] Quantidade de barbeiros:', data?.length || 0);
      
      // Log detalhado de cada barbeiro
      data?.forEach((barber, index) => {
        console.log(`[useClientFormData] Barbeiro ${index + 1}:`, {
          id: barber.id,
          name: barber.name,
          role: barber.role,
          is_active: barber.is_active,
          specialties: barber.specialties
        });
      });
      
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
    selectedService: selectedService?.name,
    isLoadingServices,
    isLoadingStaff
  });

  return {
    form,
    isLoading,
    services,
    staffMembers,
    selectedService,
  };
};
