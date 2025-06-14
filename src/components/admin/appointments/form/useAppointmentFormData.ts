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
        .from('appointments')
        .select(`
          *,
          clients(*),
          services(*),
          staff(*)
        `)
        .eq('id', appointmentId)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!appointmentId,
  });

  // Fetch services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw new Error(error.message);
      return data as Service[];
    },
  });

  // Fetch staff (agora só barbeiros)
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .eq('role', 'barber')
        .order('name');
      if (error) throw new Error(error.message);
      return data as StaffMember[];
    },
  });

  // Fetch clients
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw new Error(error.message);
      return data as Client[];
    },
  });

  // Populate form with existing appointment data
  useEffect(() => {
    if (appointmentData) {
      const startTime = new Date(appointmentData.start_time);
      const timeString = startTime.toTimeString().slice(0, 5);
      
      form.reset({
        client_id: appointmentData.client_id,
        service_id: appointmentData.service_id,
        staff_id: appointmentData.staff_id || '',
        date: startTime,
        time: timeString,
        notes: appointmentData.notes || '',
        couponCode: appointmentData.coupon_code || '',
        discountAmount: appointmentData.discount_amount || 0,
      });

      // Set selected service
      if (services) {
        const service = services.find(s => s.id === appointmentData.service_id);
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
