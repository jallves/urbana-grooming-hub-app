
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isBefore, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppointmentConfirmation } from '@/hooks/useAppointmentConfirmation';
import { StaffMember, Service } from '@/types/appointment';

interface BarberAvailabilityInfo {
  id: string;
  name: string;
  available: boolean;
}

const formSchema = z.object({
  serviceId: z.string({
    required_error: "Por favor, selecione um serviço"
  }),
  barberId: z.string({
    required_error: "Por favor, selecione um barbeiro"
  }),
  date: z.date({
    required_error: "Por favor, selecione uma data"
  }),
  time: z.string({
    required_error: "Por favor, selecione um horário"
  }),
  notes: z.string().optional(),
});

export type ClientAppointmentFormData = z.infer<typeof formSchema>;

export function useClientAppointmentForm(clientId: string) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barberAvailability, setBarberAvailability] = useState<BarberAvailabilityInfo[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const { toast } = useToast();
  const { sendConfirmation, isSending } = useAppointmentConfirmation();

  const form = useForm<ClientAppointmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: '',
      barberId: '',
      notes: '',
    },
  });

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (error) throw error;
        setClientData(data);
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Fetch services and barbers when component mounts
  useEffect(() => {
    const fetchServicesAndBarbers = async () => {
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true);

        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        const { data: barbersData, error: barbersError } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true);

        if (barbersError) throw barbersError;
        setBarbers(barbersData || []);
      } catch (error: any) {
        console.error('Error fetching services or barbers:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os serviços ou barbeiros disponíveis.',
          variant: 'destructive',
        });
      }
    };

    fetchServicesAndBarbers();
  }, [toast]);

  // When service changes, update selected service details
  useEffect(() => {
    const serviceId = form.getValues('serviceId');
    if (!serviceId) return;
    
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service || null);
    
    form.setValue('barberId', '');
    form.setValue('date', undefined as any);
    form.setValue('time', '');
  }, [form.watch('serviceId'), services, form]);

  const generateTimeSlots = (selectedDate: Date | undefined, serviceDuration: number) => {
    if (!selectedDate) return [];
    
    const slots = [];
    const today = new Date();
    const startHour = isSameDay(selectedDate, today) ? Math.max(new Date().getHours() + 1, 8) : 8;
    
    for (let hour = startHour; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (isSameDay(selectedDate, today)) {
          const currentTime = new Date();
          if (hour < currentTime.getHours() || (hour === currentTime.getHours() && minute <= currentTime.getMinutes())) {
            continue;
          }
        }
        
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    
    return slots;
  };

  const checkBarberAvailability = async (date: Date, timeSlot: string) => {
    if (!date || !timeSlot || !selectedService || !barbers.length) {
      console.log('Dados insuficientes para verificação, mostrando todos como disponíveis');
      setBarberAvailability(barbers.map(barber => ({
        id: barber.id,
        name: barber.name,
        available: true
      })));
      return;
    }

    console.log('Verificando disponibilidade dos barbeiros:', { date, timeSlot, serviceDuration: selectedService.duration });
    setIsCheckingAvailability(true);

    try {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      console.log('Verificando conflitos entre:', startTime.toISOString(), 'e', endTime.toISOString());

      const activeBarbers = barbers.filter(barber => barber.is_active);
      
      const availability = await Promise.all(activeBarbers.map(async (barber) => {
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', barber.id)
          .eq('status', 'scheduled')
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lte('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          console.error('Erro ao verificar disponibilidade para', barber.name, ':', error);
          return {
            id: barber.id,
            name: barber.name,
            available: false
          };
        }

        console.log(`Agendamentos encontrados para ${barber.name}:`, appointments);

        const hasConflict = appointments?.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          
          const conflict = startTime < appEnd && endTime > appStart;
          
          if (conflict) {
            console.log(`Conflito encontrado para ${barber.name}:`, {
              existente: `${appStart.toISOString()} - ${appEnd.toISOString()}`,
              novo: `${startTime.toISOString()} - ${endTime.toISOString()}`
            });
          }
          
          return conflict;
        }) || false;

        return {
          id: barber.id,
          name: barber.name,
          available: !hasConflict
        };
      }));

      console.log('Resultado da verificação de disponibilidade:', availability);
      setBarberAvailability(availability);

      const currentBarberId = form.getValues('barberId');
      if (currentBarberId) {
        const currentBarberAvailable = availability.find(b => b.id === currentBarberId)?.available;
        if (!currentBarberAvailable) {
          const firstAvailable = availability.find(b => b.available);
          if (firstAvailable) {
            form.setValue('barberId', firstAvailable.id);
            toast({
              title: "Barbeiro não disponível",
              description: `O barbeiro selecionado não está disponível neste horário. Selecionamos ${firstAvailable.name} automaticamente.`,
            });
          } else {
            form.setValue('barberId', '');
            toast({
              title: "Nenhum barbeiro disponível",
              description: "Não há barbeiros disponíveis para o horário selecionado. Por favor, escolha outro horário.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking barber availability:", error);
      toast({
        title: "Erro ao verificar disponibilidade",
        description: "Não foi possível verificar a disponibilidade dos barbeiros.",
        variant: "destructive",
      });
      setBarberAvailability(barbers.map(barber => ({
        id: barber.id,
        name: barber.name,
        available: true
      })));
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Update available times when date changes
  useEffect(() => {
    const selectedDate = form.getValues('date');
    if (selectedDate && selectedService) {
      const times = generateTimeSlots(selectedDate, selectedService.duration);
      setAvailableTimes(times);
      form.setValue('time', '');
    }
  }, [form.watch('date'), selectedService, form]);

  // Check availability when time changes
  useEffect(() => {
    const selectedDate = form.getValues('date');
    const selectedTime = form.getValues('time');
    
    if (selectedDate && selectedTime && selectedService) {
      checkBarberAvailability(selectedDate, selectedTime);
    }
  }, [form.watch('time'), form.watch('date'), selectedService, form]);

  const disabledDays = (date: Date) => {
    return isBefore(date, new Date()) && !isSameDay(date, new Date());
  };

  const onSubmit = async (values: ClientAppointmentFormData) => {
    if (!selectedService || !clientId || !clientData) return;
    
    setLoading(true);
    
    try {
      const [hours, minutes] = values.time.split(':').map(Number);
      const startTime = new Date(values.date);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          service_id: values.serviceId,
          staff_id: values.barberId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'scheduled',
          notes: values.notes || null,
        })
        .select(`
          *,
          services:service_id (*),
          staff:staff_id (*)
        `)
        .single();

      if (error) throw error;

      // Enviar confirmação automaticamente por email
      await sendConfirmation({
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientPhone: clientData.phone || '',
        serviceName: selectedService.name,
        staffName: appointmentData.staff.name,
        appointmentDate: startTime,
        servicePrice: selectedService.price.toString(),
        serviceDuration: selectedService.duration,
        preferredMethod: 'email',
      });

      // Mostrar mensagem de sucesso
      toast({
        title: "Agendamento Realizado com Sucesso",
        description: `Seu agendamento foi confirmado para ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. A confirmação foi enviada por email.`,
      });

      form.reset();
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Não foi possível realizar o agendamento. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    services,
    barbers,
    selectedService,
    availableTimes,
    barberAvailability,
    isCheckingAvailability,
    clientData,
    isSending,
    disabledDays,
    onSubmit,
  };
}
