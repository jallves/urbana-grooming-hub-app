
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service, StaffMember } from '@/types/appointment';
import { toast } from '@/hooks/use-toast';

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
    return dayOfWeek !== 0;
  }, 'Não atendemos aos domingos'),
  time: z.string().min(1, 'Horário é obrigatório')
    .refine((time) => {
      const [hours] = time.split(':').map(Number);
      return hours >= 9 && hours < 20;
    }, 'Horário deve ser entre 09h e 20h'),
  notes: z.string().optional(),
});

export type ClientAppointmentFormValues = z.infer<typeof formSchema>;

export const useClientAppointmentForm = (defaultDate: Date = new Date(), appointmentId?: string) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const form = useForm<ClientAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_id: '',
      staff_id: '',
      date: defaultDate,
      time: '',
      notes: '',
    },
  });

  // Fetch serviços usando a mesma query do admin
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['client-services'],
    queryFn: async () => {
      console.log('🔍 Cliente: Buscando serviços...');
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

  // Fetch staff (barbeiros) - usando a tabela staff correta
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['client-staff'],
    queryFn: async () => {
      console.log('🔍 Cliente: Buscando barbeiros da tabela staff...');
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('❌ Erro ao buscar staff:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Staff encontrados:', data?.length || 0, data);
      return data as StaffMember[];
    },
  });

  // Buscar dados do agendamento existente se estivermos editando
  const { data: appointmentData } = useQuery({
    queryKey: ['client-appointment', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      
      console.log('🔍 Cliente: Buscando dados do agendamento:', appointmentId);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services(*),
          staff(*)
        `)
        .eq('id', appointmentId)
        .single();
      
      if (error) {
        console.error('❌ Erro ao buscar agendamento:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Dados do agendamento encontrados:', data);
      return data;
    },
    enabled: !!appointmentId,
  });

  // Popular formulário com dados existentes
  useEffect(() => {
    if (appointmentData) {
      const startTime = new Date(appointmentData.start_time);
      const timeString = startTime.toTimeString().slice(0, 5);
      
      form.reset({
        service_id: appointmentData.service_id,
        staff_id: appointmentData.staff_id || '',
        date: startTime,
        time: timeString,
        notes: appointmentData.notes || '',
      });

      if (services) {
        const service = services.find(s => s.id === appointmentData.service_id);
        setSelectedService(service || null);
      }
    }
  }, [appointmentData, services, form]);

  // Atualiza serviço selecionado
  useEffect(() => {
    const subscription = form.watch((values) => {
      const service = services?.find((s) => s.id === values.service_id);
      setSelectedService(service || null);
    });
    return () => subscription.unsubscribe();
  }, [services, form]);

  const isLoading = isLoadingServices || isLoadingStaff;

  return {
    form,
    isLoading,
    services: services || [],
    staffMembers: staffMembers || [],
    selectedService,
  };
};
