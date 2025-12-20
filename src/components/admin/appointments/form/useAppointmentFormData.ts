
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service, StaffMember, Client } from '@/types/appointment';

const formSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  staff_id: z.string().min(1, 'Profissional é obrigatório'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  time: z.string().min(1, 'Horário é obrigatório'),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  discountAmount: z.number().default(0),
});

export type FormValues = z.infer<typeof formSchema>;

export const useAppointmentFormData = (appointmentId?: string, defaultDate: Date = new Date()) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: '',
      service_id: '',
      staff_id: '',
      date: defaultDate,
      time: '',
      notes: '',
      couponCode: '',
      discountAmount: 0,
    },
  });

  // Fetch existing appointment data if editing
  const { data: appointmentData, isLoading: isLoadingAppointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          cliente:painel_clientes(*),
          servico:painel_servicos(*),
          barbeiro:painel_barbeiros(*)
        `)
        .eq('id', appointmentId)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!appointmentId,
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
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['painel_barbeiros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('is_active', true)
        .order('nome');
      if (error) throw new Error(error.message);
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
        role: b.role,
        staff_id: b.staff_id // Incluir staff_id para uso nas RPCs
      })) as (StaffMember & { staff_id?: string })[];
    },
  });

  // Fetch clients do painel_clientes
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['painel_clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('*')
        .order('nome');
      
      if (error) throw new Error(error.message);
      return (data || []).map(c => ({ id: c.id, name: c.nome, email: c.email, phone: c.whatsapp, whatsapp: c.whatsapp, birth_date: c.data_nascimento })) as Client[];
    },
  });

  // Populate form with existing appointment data
  useEffect(() => {
    if (appointmentData) {
      const startDate = new Date(`${appointmentData.data}T${appointmentData.hora}`);
      
      form.reset({
        client_id: appointmentData.cliente_id,
        service_id: appointmentData.servico_id,
        staff_id: appointmentData.barbeiro_id,
        date: startDate,
        time: appointmentData.hora,
        notes: '',
        couponCode: '',
        discountAmount: 0,
      });

      // Set selected service
      if (services && appointmentData.servico) {
        const service = services.find(s => s.id === appointmentData.servico_id);
        setSelectedService(service || null);
      }
    }
  }, [appointmentData, services, form]);

  // Update selected service when service_id changes
  useEffect(() => {
    const serviceId = form.watch('service_id');
    if (services && serviceId) {
      const service = services.find(s => s.id === serviceId);
      setSelectedService(service || null);
    }
  }, [form.watch('service_id'), services]);

  const isLoading = isLoadingAppointment || isLoadingServices || isLoadingStaff || isLoadingClients;

  return {
    form,
    isLoading,
    services: services || [],
    staffMembers: staffMembers || [],
    clients: clients || [],
    selectedService,
  };
};
