
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
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

interface Staff {
  id: string;
  name: string;
  is_active: boolean;
  role: string;
}

const BarbershopBookingForm: React.FC = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

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

      // Buscar barbeiros ativos
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, is_active, role')
        .eq('is_active', true)
        .eq('role', 'barber')
        .order('name');

      if (staffError) {
        console.error('Erro ao buscar barbeiros:', staffError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os barbeiros disponíveis.",
          variant: "destructive",
        });
      } else {
        setStaff(staffData || []);
      }

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

      const { data: slots, error } = await supabase.rpc('get_available_time_slots', {
        p_staff_id: watchedStaffId,
        p_date: watchedDate.toISOString().split('T')[0],
        p_service_duration: selectedService.duration
      });

      if (error) {
        console.error('Erro ao buscar horários:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os horários disponíveis.",
          variant: "destructive",
        });
        setAvailableTimes([]);
      } else {
        const timeSlots = (slots || []).map((slot: any) => slot.time_slot);
        setAvailableTimes(timeSlots);
        
        if (timeSlots.length === 0) {
          toast({
            title: "Sem horários disponíveis",
            description: "Não há horários disponíveis para a data e barbeiro selecionados.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      setAvailableTimes([]);
    } finally {
      setCheckingAvailability(false);
    }
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
      const { data: clientId, error: clientError } = await supabase.rpc(
        'create_public_client',
        {
          client_name: data.name,
          client_phone: data.phone,
          client_email: data.email || null
        }
      );

      if (clientError) {
        console.error('Erro ao criar cliente:', clientError);
        throw new Error('Erro ao processar dados do cliente');
      }

      // Criar horários de início e fim
      const [hours, minutes] = data.time.split(':').map(Number);
      const startTime = new Date(data.date);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      // Criar agendamento
      const { data: appointmentId, error: appointmentError } = await supabase.rpc(
        'create_public_appointment',
        {
          p_client_id: clientId,
          p_service_id: data.service_id,
          p_staff_id: data.staff_id,
          p_start_time: startTime.toISOString(),
          p_end_time: endTime.toISOString(),
          p_notes: data.notes || null
        }
      );

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
                      {staff.map((barber) => (
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
                    disabled={!watchedDate || checkingAvailability || availableTimes.length === 0}
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
                           'Nenhum horário disponível'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
