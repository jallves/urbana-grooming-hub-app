
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service, StaffMember, Client } from '@/types/appointment';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  client_id: z.string().uuid({ message: 'Selecione um cliente' }),
  service_id: z.string().uuid({ message: 'Selecione um serviço' }),
  staff_id: z.string().uuid({ message: 'Selecione um barbeiro' }),
  date: z.date({ required_error: 'Selecione uma data' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido' }),
  notes: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export const useAppointmentFormData = (appointmentId?: string, defaultDate: Date = new Date()) => {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: defaultDate,
      time: format(defaultDate, 'HH:mm'),
      notes: '',
    },
  });
  
  // Fetch data (services, staff members, clients and existing appointment if editing)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true);
          
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
        
        // Fetch staff members
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true);
          
        if (staffError) throw staffError;
        setStaffMembers(staffData || []);
        
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*');
          
        if (clientsError) throw clientsError;
        setClients(clientsData || []);
        
        // If editing an existing appointment
        if (appointmentId) {
          const { data: appointment, error } = await supabase
            .from('appointments')
            .select('*, client:client_id(*), service:service_id(*)')
            .eq('id', appointmentId)
            .single();
            
          if (error) throw error;
          
          if (appointment) {
            const appointmentDate = new Date(appointment.start_time);
            form.reset({
              client_id: appointment.client_id,
              service_id: appointment.service_id,
              staff_id: '', // Need to update schema to include staff
              date: appointmentDate,
              time: format(appointmentDate, 'HH:mm'),
              notes: appointment.notes || '',
            });
            
            // Set selected service for duration calculation
            const service = servicesData?.find(s => s.id === appointment.service_id);
            if (service) setSelectedService(service);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os dados necessários.",
        });
      }
    };
    
    fetchData();
  }, [appointmentId, form]);
  
  // Watch for service changes to update selected service
  const selectedServiceId = form.watch('service_id');
  
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find(s => s.id === selectedServiceId);
      setSelectedService(service || null);
    }
  }, [selectedServiceId, services]);

  return {
    form,
    isLoading,
    setIsLoading,
    services,
    staffMembers,
    clients,
    selectedService
  };
};
