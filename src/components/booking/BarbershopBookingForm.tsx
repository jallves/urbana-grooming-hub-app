import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRPC } from '@/types/supabase-rpc';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  service_id: z.string().min(1, 'Selecione um serviço'),
  staff_id: z.string().min(1, 'Selecione um barbeiro'),
  date: z.date({
    required_error: 'Selecione uma data',
  }),
  time: z.string().min(1, 'Selecione um horário'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  is_active: boolean;
}

interface Barber {
  id: string;
  name: string;
  is_active: boolean;
  role: string;
}

const BarbershopBookingForm: React.FC = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      service_id: '',
      staff_id: '',
      time: '',
      notes: '',
    },
  });

  const watchedDate = form.watch('date');
  const watchedServiceId = form.watch('service_id');
  const watchedStaffId = form.watch('staff_id');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (watchedDate && watchedServiceId && watchedStaffId) {
      fetchAvailableTimes();
    } else {
      setAvailableTimes([]);
      form.setValue('time', '');
    }
  }, [watchedDate, watchedServiceId, watchedStaffId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Buscar serviços ativos
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, price, duration, is_active')
        .eq('is_active', true)
        .order('name');

      if (servicesError) {
        console.error('Erro ao buscar serviços:', servicesError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços disponíveis.",
          variant: "destructive",
        });
      } else {
        setServices(servicesData || []);
      }

      // Buscar barbeiros ativos da tabela barbers
      fetchBarbers();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados iniciais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    if (!watchedDate || !watchedServiceId || !watchedStaffId) return;

    setCheckingAvailability(true);
    try {
      const selectedService = services.find(s => s.id === watchedServiceId);
      if (!selectedService) return;

      console.log('Buscando horários disponíveis para:', {
        staffId: watchedStaffId,
        date: watchedDate.toISOString().split('T')[0],
        duration: selectedService.duration
      });

      // Primeiro, verificar se o barbeiro tem horário de trabalho configurado
      const { data: workingHours, error: workingHoursError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('staff_id', watchedStaffId)
        .eq('day_of_week', watchedDate.getDay())
        .eq('is_active', true);

      console.log('Horários de trabalho encontrados:', workingHours);

      if (workingHoursError) {
        console.error('Erro ao buscar horários de trabalho:', workingHoursError);
      }

      // Se não há horários de trabalho configurados, gerar horários padrão
      if (!workingHours || workingHours.length === 0) {
        console.log('Nenhum horário de trabalho configurado, usando horários padrão');
        const defaultTimes = generateDefaultTimeSlots(selectedService.duration);
        setAvailableTimes(defaultTimes);
        return;
      }

      // Tentar usar a função RPC primeiro
      const { data: slots, error } = await supabaseRPC.getAvailableTimeSlots(
        watchedStaffId,
        watchedDate.toISOString().split('T')[0],
        selectedService.duration
      );

      if (error) {
        console.error('Erro ao buscar horários via RPC:', error);
        // Fallback: gerar horários manualmente
        const manualSlots = await generateManualTimeSlots(
          watchedStaffId, 
          watchedDate, 
          selectedService.duration,
          workingHours[0]
        );
        setAvailableTimes(manualSlots);
      } else {
        const timeSlots = (slots || []).map((slot: any) => slot.time_slot);
        console.log('Horários encontrados via RPC:', timeSlots);
        
        if (timeSlots.length === 0) {
          console.log('RPC retornou array vazio, tentando geração manual');
          const manualSlots = await generateManualTimeSlots(
            watchedStaffId, 
            watchedDate, 
            selectedService.duration,
            workingHours[0]
          );
          setAvailableTimes(manualSlots);
        } else {
          setAvailableTimes(timeSlots);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      // Como fallback, gerar horários básicos
      const fallbackTimes = generateDefaultTimeSlots(30); // 30 min padrão
      setAvailableTimes(fallbackTimes);
      
      toast({
        title: "Aviso",
        description: "Usando horários padrão devido a erro na verificação de disponibilidade.",
        variant: "destructive",
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const fetchBarbers = async () => {
    setLoadingBarbers(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .eq('role', 'barber')
        .order('name');

      if (error) {
        console.error('Erro ao buscar barbeiros:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os barbeiros.",
          variant: "destructive",
        });
      } else {
        setBarbers(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao buscar barbeiros.",
        variant: "destructive",
      });
    } finally {
      setLoadingBarbers(false);
    }
  };

  const generateDefaultTimeSlots = (serviceDuration: number): string[] => {
    const slots: string[] = [];
    const startHour = 9; // 9:00
    const endHour = 18; // 18:00
    const intervalMinutes = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Verificar se há tempo suficiente para o serviço
        const currentTime = hour * 60 + minute;
        const endTime = currentTime + serviceDuration;
        const endHourCheck = Math.floor(endTime / 60);
        
        if (endHourCheck <= endHour) {
          slots.push(timeString);
        }
      }
    }

    console.log('Horários padrão gerados:', slots);
    return slots;
  };

  const generateManualTimeSlots = async (
    staffId: string, 
    date: Date, 
    serviceDuration: number,
    workingHour: any
  ): Promise<string[]> => {
    const slots: string[] = [];
    const intervalMinutes = 30;

    // Converter horários de trabalho para minutos
    const [startHour, startMinute] = workingHour.start_time.split(':').map(Number);
    const [endHour, endMinute] = workingHour.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    console.log(`Gerando horários manuais de ${workingHour.start_time} até ${workingHour.end_time}`);

    // Buscar agendamentos existentes para o dia
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('staff_id', staffId)
      .gte('start_time', date.toISOString().split('T')[0] + ' 00:00:00')
      .lt('start_time', date.toISOString().split('T')[0] + ' 23:59:59')
      .in('status', ['scheduled', 'confirmed']);

    console.log('Agendamentos existentes:', existingAppointments);

    for (let currentMinutes = startMinutes; currentMinutes + serviceDuration <= endMinutes; currentMinutes += intervalMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Verificar conflitos com agendamentos existentes
      const slotStart = new Date(date);
      slotStart.setHours(hour, minute, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      const hasConflict = existingAppointments?.some(appointment => {
        const appStart = new Date(appointment.start_time);
        const appEnd = new Date(appointment.end_time);
        return slotStart < appEnd && slotEnd > appStart;
      });

      if (!hasConflict) {
        slots.push(timeString);
      }
    }

    console.log('Horários manuais gerados:', slots);
    return slots;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Não permitir datas passadas
    if (date < today) return true;
    
    // Não permitir domingos (0 = domingo)
    if (date.getDay() === 0) return true;
    
    return false;
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const selectedService = services.find(s => s.id === data.service_id);
      if (!selectedService) {
        throw new Error('Serviço não encontrado');
      }

      // Criar ou encontrar cliente
      let clientId;
      
      // Primeiro, tentar encontrar cliente existente pelo telefone
      const { data: existingClient, error: searchError } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', data.phone)
        .maybeSingle();

      if (searchError) {
        console.error('Erro ao buscar cliente:', searchError);
        throw new Error('Erro ao verificar cliente existente');
      }

      if (existingClient) {
        // Cliente encontrado, usar ID existente
        clientId = existingClient.id;
      } else {
        // Criar novo cliente
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: data.name,
            phone: data.phone,
            email: data.email || null
          })
          .select('id')
          .single();

        if (clientError) {
          console.error('Erro ao criar cliente:', clientError);
          throw new Error('Erro ao criar dados do cliente');
        }

        clientId = newClient.id;
      }

      // Criar horários de início e fim
      const [hours, minutes] = data.time.split(':').map(Number);
      const startTime = new Date(data.date);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      // Verificar conflito antes de criar agendamento
      const { data: hasConflict, error: conflictError } = await supabase.rpc('check_appointment_conflict', {
        p_staff_id: data.staff_id,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString()
      });

      if (conflictError) {
        console.error('Erro ao verificar conflito:', conflictError);
        throw new Error('Erro ao verificar disponibilidade');
      }

      if (hasConflict) {
        throw new Error('Horário não disponível. Por favor, selecione outro horário.');
      }

      // Criar agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          service_id: data.service_id,
          staff_id: data.staff_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'scheduled',
          notes: data.notes || null
        })
        .select('id')
        .single();

      if (appointmentError) {
        console.error('Erro ao criar agendamento:', appointmentError);
        throw new Error('Erro ao criar agendamento');
      }

      toast({
        title: "Agendamento realizado com sucesso!",
        description: `Seu agendamento foi confirmado para ${format(data.date, "dd 'de' MMMM", { locale: ptBR })} às ${data.time}.`,
      });

      // Resetar formulário
      form.reset();
      setAvailableTimes([]);

    } catch (error: any) {
      console.error('Erro ao processar agendamento:', error);
      toast({
        title: "Erro ao agendar",
        description: error.message || "Não foi possível processar seu agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Carregando...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-stone-900 border-stone-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-urbana-gold flex items-center justify-center gap-2">
          <Scissors className="h-6 w-6" />
          Agendar Horário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Dados Pessoais */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Seu nome completo"
                      className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone/WhatsApp
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="(11) 99999-9999"
                      className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Serviço */}
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Serviço
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-stone-800 border-stone-600">
                      {services.map((service) => (
                        <SelectItem
                          key={service.id}
                          value={service.id}
                          className="text-white hover:bg-stone-700"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{service.name}</span>
                            <span className="text-amber-400 ml-4">
                              R$ {service.price.toFixed(2)} ({service.duration}min)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Barbeiro */}
            <FormField
              control={form.control}
              name="staff_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Barbeiro
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                        <SelectValue placeholder="Selecione um barbeiro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-stone-800 border-stone-600">
                      {barbers.map((barber) => (
                        <SelectItem
                          key={barber.id}
                          value={barber.id}
                          className="text-white hover:bg-stone-700"
                        >
                          {barber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Data */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-white flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Data
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "bg-stone-700 border-stone-600 text-white hover:bg-stone-600 justify-start text-left font-normal",
                            !field.value && "text-stone-400"
                          )}
                          disabled={!watchedServiceId || !watchedStaffId}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "EEEE, dd 'de' MMMM", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-stone-800 border-stone-600" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={isDateDisabled}
                        initialFocus
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                  {(!watchedServiceId || !watchedStaffId) && (
                    <p className="text-sm text-stone-400">
                      Selecione um serviço e barbeiro primeiro
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Seleção de Horário */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário
                    {checkingAvailability && (
                      <span className="text-sm text-stone-400">(Verificando...)</span>
                    )}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!watchedDate || checkingAvailability}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-stone-800 border-stone-600">
                      {availableTimes.length > 0 ? (
                        availableTimes.map((time) => (
                          <SelectItem
                            key={time}
                            value={time}
                            className="text-white hover:bg-stone-700"
                          >
                            {time}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1 text-sm text-stone-400">
                          {!watchedDate ? 'Selecione uma data primeiro' : 
                           checkingAvailability ? 'Verificando disponibilidade...' : 
                           'Sem horários disponíveis para esta data'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {watchedDate && watchedServiceId && watchedStaffId && availableTimes.length === 0 && !checkingAvailability && (
                    <p className="text-sm text-amber-400">
                      Verifique se o barbeiro tem horários de trabalho configurados para esta dia da semana.
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    Observações (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Alguma observação especial..."
                      className="bg-stone-700 border-stone-600 text-white placeholder:text-stone-400 resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-urbana-gold hover:bg-amber-500 text-urbana-black font-semibold py-3"
              disabled={submitting}
            >
              {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BarbershopBookingForm;
