
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const appointmentSchema = z.object({
  service_id: z.string().min(1, 'Selecione um serviço'),
  date: z.date({
    required_error: 'Selecione uma data',
  }),
  time: z.string().min(1, 'Selecione um horário'),
  staff_id: z.string().min(1, 'Selecione um barbeiro'),
  notes: z.string().optional(),
});

export type FormData = z.infer<typeof appointmentSchema>;

export const useClientFormData = (clientName: string) => {
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      service_id: '',
      time: '',
      staff_id: '',
      notes: '',
    },
  });

  // Buscar serviços
  useEffect(() => {
    const fetchServices = async () => {
      console.log('[useClientFormData] Buscando serviços...');
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('[useClientFormData] Erro ao buscar serviços:', error);
          throw error;
        }

        console.log('[useClientFormData] Serviços encontrados:', data);
        setServices(data || []);
      } catch (error) {
        console.error('[useClientFormData] Erro ao buscar serviços:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços.",
          variant: "destructive",
        });
        setServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, [toast]);

  // Buscar barbeiros da tabela staff
  useEffect(() => {
    const fetchStaff = async () => {
      console.log('[useClientFormData] Buscando barbeiros da tabela staff...');
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name, email, phone, role, image_url, experience, specialties, is_active')
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name');

        if (error) {
          console.error('[useClientFormData] Erro ao buscar barbeiros da tabela staff:', error);
          throw error;
        }

        console.log('[useClientFormData] Barbeiros encontrados:', data);
        setStaffMembers(data || []);
      } catch (error) {
        console.error('[useClientFormData] Erro ao buscar barbeiros da tabela staff:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os barbeiros.",
          variant: "destructive",
        });
        setStaffMembers([]);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [toast]);

  // Atualizar serviço selecionado quando service_id muda
  useEffect(() => {
    const serviceId = form.watch('service_id');
    if (serviceId && services.length > 0) {
      const service = services.find(s => s.id === serviceId);
      setSelectedService(service || null);
      console.log('[useClientFormData] Serviço selecionado:', service);
    } else {
      setSelectedService(null);
    }
  }, [form.watch('service_id'), services]);

  const isLoading = isLoadingServices || isLoadingStaff;

  console.log('[useClientFormData] Estado atual:', {
    isLoading,
    servicesCount: services.length,
    staffCount: staffMembers.length,
    selectedService: selectedService?.name || 'nenhum',
    isLoadingServices,
    isLoadingStaff
  });

  return {
    form,
    isLoading,
    services,
    staffMembers,
    selectedService,
    setSelectedService,
  };
};
