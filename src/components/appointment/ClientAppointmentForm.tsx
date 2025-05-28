import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, isBefore, isAfter, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppointmentConfirmation } from '@/hooks/useAppointmentConfirmation';
import { Calendar as CalendarIcon, Clock, User, Scissors, MessageCircle, Mail, Phone } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
  confirmationMethod: z.enum(['email', 'whatsapp'], {
    required_error: "Por favor, selecione como deseja receber a confirmação"
  }),
  phone: z.string().optional(),
});

export default function ClientAppointmentForm({ clientId }: ClientAppointmentFormProps) {
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: '',
      barberId: '',
      notes: '',
      confirmationMethod: 'email',
      phone: '',
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

  // Generate time slots based on business hours (8:00 to 20:00)
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

  // Check barber availability for the selected date and time
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

  const availableBarbers = barberAvailability.filter(barber => barber.available);
  const unavailableBarbers = barberAvailability.filter(barber => !barber.available);

  const watchConfirmationMethod = form.watch('confirmationMethod');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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

      // Enviar confirmação
      await sendConfirmation({
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientPhone: values.phone,
        serviceName: selectedService.name,
        staffName: appointmentData.staff.name,
        appointmentDate: startTime,
        servicePrice: selectedService.price.toString(),
        serviceDuration: selectedService.duration,
        preferredMethod: values.confirmationMethod,
      });

      // Mostrar mensagem de sucesso
      toast({
        title: "Agendamento Realizado com Sucesso",
        description: `Seu agendamento foi confirmado para ${format(startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}. A confirmação foi enviada por ${values.confirmationMethod === 'email' ? 'email' : 'WhatsApp'}.`,
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
              <FormLabel>
                Barbeiro
                {isCheckingAvailability && <span className="ml-2 text-sm text-gray-500">(Verificando disponibilidade...)</span>}
              </FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value} 
                disabled={!form.getValues('time') || isCheckingAvailability}
              >
                <FormControl>
                  <SelectTrigger className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableBarbers.map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name} ✅ Disponível
                    </SelectItem>
                  ))}
                  
                  {unavailableBarbers.map(barber => (
                    <SelectItem 
                      key={barber.id} 
                      value={barber.id} 
                      disabled
                      className="opacity-50"
                    >
                      {barber.name} ❌ Indisponível
                    </SelectItem>
                  ))}
                  
                  {barberAvailability.length === 0 && barbers
                    .filter(barber => barber.is_active)
                    .map(barber => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <FormMessage />
              {availableBarbers.length === 0 && barberAvailability.length > 0 && (
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

        {/* Confirmation Method */}
        <FormField
          control={form.control}
          name="confirmationMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Como deseja receber a confirmação?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center cursor-pointer">
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="flex items-center cursor-pointer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Number (conditional) */}
        {watchConfirmationMethod === 'whatsapp' && (
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do WhatsApp</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(11) 99999-9999" 
                    {...field}
                    className="flex items-center"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
          disabled={loading || isSending || !form.formState.isValid}
        >
          {loading || isSending ? "Agendando..." : "Confirmar Agendamento"}
        </Button>
      </form>
    </Form>
  );
}
