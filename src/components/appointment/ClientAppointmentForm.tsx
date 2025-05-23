
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, isBefore, isAfter, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { StaffMember, Service } from '@/types/appointment';

interface BarberAvailabilityInfo {
  id: string;
  name: string;
  available: boolean;
}

interface ClientAppointmentFormProps {
  clientId: string;
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

export default function ClientAppointmentForm({ clientId }: ClientAppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<StaffMember[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barberAvailability, setBarberAvailability] = useState<BarberAvailabilityInfo[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: '',
      barberId: '',
      notes: '',
    },
  });

  // Fetch services and barbers when component mounts
  useEffect(() => {
    const fetchServicesAndBarbers = async () => {
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true);

        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        // Fetch barbers
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
    
    // Reset barber, date and time when service changes
    form.setValue('barberId', '');
    form.setValue('date', undefined as any);
    form.setValue('time', '');
  }, [form.watch('serviceId'), services, form]);

  // Generate time slots based on business hours (8:00 to 20:00)
  const generateTimeSlots = (selectedDate: Date | undefined, serviceDuration: number) => {
    if (!selectedDate) return [];
    
    const slots = [];
    const today = new Date();
    const startHour = isSameDay(selectedDate, today) ? new Date().getHours() + 1 : 8; // Next hour if today
    
    for (let hour = startHour; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip times in the past for today
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

  // Check barber availability for the selected date and time
  const checkBarberAvailability = async (date: Date, timeSlot: string) => {
    if (!date || !timeSlot || !selectedService) return;

    try {
      // Create start time from date and timeSlot
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);

      // Create end time based on service duration
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      // Format times for query
      const startISOString = startTime.toISOString();
      const endISOString = endTime.toISOString();

      // Check availability for all barbers
      const availability = await Promise.all(barbers.map(async (barber) => {
        // Check if there are any overlapping appointments
        const { data: overlappingAppointments, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('staff_id', barber.id)
          .eq('status', 'scheduled')
          .or(`start_time.lt.${endISOString},end_time.gt.${startISOString}`);

        if (error) throw error;

        const isAvailable = !overlappingAppointments || overlappingAppointments.length === 0;
        
        return {
          id: barber.id,
          name: barber.name,
          available: isAvailable
        };
      }));

      setBarberAvailability(availability);

      // Update form value if selected barber is not available
      const currentBarberId = form.getValues('barberId');
      if (currentBarberId) {
        const currentBarberAvailable = availability.find(b => b.id === currentBarberId)?.available;
        if (!currentBarberAvailable) {
          // Find first available barber
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
    }
  };

  // Update available times when date changes
  useEffect(() => {
    const selectedDate = form.getValues('date');
    if (selectedDate && selectedService) {
      const times = generateTimeSlots(selectedDate, selectedService.duration);
      setAvailableTimes(times);
      
      // Reset time when date changes
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

  // Filter future dates only (starting from today)
  const disabledDays = (date: Date) => {
    return isBefore(date, new Date()) && !isSameDay(date, new Date());
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedService || !clientId) return;
    
    setLoading(true);
    
    try {
      // Create date objects for start and end time
      const [hours, minutes] = values.time.split(':').map(Number);
      const startTime = new Date(values.date);
      startTime.setHours(hours, minutes, 0, 0);

      // Calculate end time based on service duration
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      // Insert appointment
      const { data, error } = await supabase
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
        .select();

      if (error) throw error;

      toast({
        title: "Agendamento realizado com sucesso!",
        description: `Seu horário foi agendado para ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      });
      
      // Reset form
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Service Selection */}
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serviço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="relative flex items-center">
                    <Scissors className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Selection */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal flex items-center",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={!selectedService}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={disabledDays}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Selection */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.getValues('date') || !availableTimes.length}>
                <FormControl>
                  <SelectTrigger className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Barber Selection with Availability Indicator */}
        <FormField
          control={form.control}
          name="barberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barbeiro</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!form.getValues('time')}>
                <FormControl>
                  <SelectTrigger className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {barberAvailability.length > 0 ? (
                    barberAvailability
                      .filter(barber => barber.available)
                      .map(barber => (
                        <SelectItem key={barber.id} value={barber.id}>
                          {barber.name} ✅
                        </SelectItem>
                      ))
                  ) : (
                    barbers.map(barber => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
              {barberAvailability.length > 0 && barberAvailability.every(b => !b.available) && (
                <Alert className="mt-2" variant="destructive">
                  <AlertTitle>Nenhum barbeiro disponível</AlertTitle>
                  <AlertDescription>
                    Não há barbeiros disponíveis para o horário selecionado. Por favor, escolha outro horário.
                  </AlertDescription>
                </Alert>
              )}
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Informe detalhes adicionais sobre o seu agendamento" 
                  className="resize-none" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Appointment Summary */}
        {selectedService && form.getValues('date') && form.getValues('time') && (
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Resumo do Agendamento</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Serviço:</div>
              <div className="font-medium">{selectedService.name}</div>
              
              <div>Duração:</div>
              <div className="font-medium">{selectedService.duration} minutos</div>
              
              <div>Valor:</div>
              <div className="font-medium">R$ {selectedService.price}</div>
              
              <div>Data e Hora:</div>
              <div className="font-medium">
                {form.getValues('date') && (
                  format(form.getValues('date'), "dd/MM/yyyy", { locale: ptBR })
                )} às {form.getValues('time')}
              </div>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-white py-6"
          disabled={loading || !form.formState.isValid}
        >
          {loading ? "Agendando..." : "Confirmar Agendamento"}
        </Button>
      </form>
    </Form>
  );
}
