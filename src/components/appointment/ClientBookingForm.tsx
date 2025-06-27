import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useClientFormData } from './client/hooks/useClientFormData';
import { useClientFormSubmit } from './client/hooks/useClientFormSubmit';
import ClientServiceSelect from './client/ClientServiceSelect';
import { Calendar as CalendarIcon, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { format, addMinutes, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definir interfaces para tipagem forte
interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Barber {
  id: string;
  name: string;
  workingHours: {
    start: string;
    end: string;
  }[];
}

interface Client {
  id: string;
  name: string;
  email: string;
}

const formSchema = z.object({
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  staff_id: z.string().min(1, 'Barbeiro é obrigatório'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  time: z.string()
    .min(1, 'Horário é obrigatório')
    .refine(time => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
      message: 'Formato de horário inválido (HH:MM)'
    }),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Componente para resumo de erros
const FormErrorsSummary = ({ errors }: { errors: FieldErrors<FormData> }) => {
  const messages = Object.keys(errors).map((name) => {
    const key = name as keyof FormData;
    return errors[key]?.message;
  }).filter(Boolean);

  if (messages.length === 0) return null;

  return (
    <div className="text-red-500 bg-red-500/10 p-4 rounded-md mb-6">
      <h3 className="font-bold">Por favor, corrija os seguintes erros:</h3>
      <ul className="list-disc pl-5 mt-2">
        {messages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export const ClientStaffSelect: React.FC<{
  barbers: Barber[];
  form: any;
  selectedDate: Date | undefined;
  selectedTime: string;
}> = ({ barbers, form, selectedDate, selectedTime }) => {
  return (
    <FormField
      control={form.control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">Barbeiro *</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value || ""}
            disabled={!selectedDate || !selectedTime}
          >
            <FormControl>
              <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#1F2937] border-gray-600 max-h-60">
              {barbers.length > 0 ? (
                barbers.map((barber) => (
                  <SelectItem 
                    key={barber.id} 
                    value={barber.id}
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    {barber.name}
                  </SelectItem>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  Nenhum barbeiro disponível
                </div>
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-400 mt-1">
            Todos os barbeiros são qualificados para todos os serviços
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const ClientBookingForm: React.FC = () => {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const { services, barbers, loading, error } = useClientFormData();
  const { handleSubmit: submitForm, isLoading: submitting } = useClientFormSubmit({
    clientId: client?.id || '',
    onSuccess: () => navigate('/cliente/dashboard')
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_id: '',
      staff_id: '',
      date: undefined,
      time: '',
      notes: '',
    },
  });

  // Observar valores para resetar dependências
  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');
  const selectedStaffId = form.watch('staff_id');

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
      return;
    }
  }, [client, navigate]);

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service || null);
  };

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    
    // Horário de funcionamento padrão
    const startHour = 9;
    const endHour = 20;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const filterAvailableTimeSlots = (): string[] => {
    if (!selectedDate || !selectedStaffId) return timeSlots;
    
    // Simulação: filtrar horários disponíveis baseado em agendamentos existentes
    const selectedBarber = barbers.find(b => b.id === selectedStaffId);
    if (!selectedBarber) return timeSlots;
    
    // Verificar se é dia de trabalho para o barbeiro
    const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const workingDay = selectedBarber.workingHours[dayOfWeek];
    
    if (!workingDay || !workingDay.start || !workingDay.end) {
      return [];
    }
    
    return timeSlots.filter(time => {
      const [hour, minute] = time.split(':').map(Number);
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, minute, 0, 0);
      
      // Verificar se está dentro do horário de trabalho
      const [startHour, startMinute] = workingDay.start.split(':').map(Number);
      const [endHour, endMinute] = workingDay.end.split(':').map(Number);
      
      const workStart = new Date(selectedDate);
      workStart.setHours(startHour, startMinute, 0, 0);
      
      const workEnd = new Date(selectedDate);
      workEnd.setHours(endHour, endMinute, 0, 0);
      
      return isWithinInterval(slotStart, {
        start: workStart,
        end: workEnd
      });
    });
  };

  const availableTimeSlots = filterAvailableTimeSlots();

  const handleConfirmBooking = async (data: FormData) => {
    setIsConfirming(true);
    try {
      const validatedData = {
        service_id: data.service_id,
        staff_id: data.staff_id,
        date: data.date,
        time: data.time,
        notes: data.notes,
      };
      
      await submitForm(validatedData, selectedService);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao confirmar o agendamento',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    // Exibir confirmação antes de submeter
    setIsConfirming(true);
  };

  if (!client) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-400 mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button
            onClick={() => navigate('/cliente/dashboard')}
            variant="outline"
            className="mr-4 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white font-clash">
              Novo Agendamento
            </h1>
            <p className="text-[#9CA3AF] font-inter">
              Agende seu horário com nossos barbeiros qualificados
            </p>
          </div>
        </div>

        <Card className="bg-[#111827] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dados do Agendamento</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Preencha os dados do seu agendamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Resumo de erros */}
                <FormErrorsSummary errors={form.formState.errors} />

                <div>
                  <FormLabel className="text-white">Cliente</FormLabel>
                  <Input
                    value={client.name}
                    disabled
                    className="bg-[#1F2937] border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ClientServiceSelect 
                    services={services}
                    form={form}
                    onServiceChange={handleServiceChange}
                  />
                  
                  <ClientStaffSelect 
                    barbers={barbers}
                    form={form}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Data *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal bg-[#1F2937] border-gray-600 text-white hover:bg-gray-800"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione a data"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                form.setValue('time', '');
                              }}
                              disabled={(date) => date < new Date() || date.getDay() === 0}
                              initialFocus
                              locale={ptBR}
                              weekStartsOn={1}
                              fromDate={new Date()}
                              toDate={addMonths(new Date(), 2)}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Horário *</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={!selectedDate || !selectedStaffId}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
                              <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1F2937] border-gray-600 max-h-60">
                            {availableTimeSlots.length > 0 ? (
                              availableTimeSlots.map((time) => (
                                <SelectItem 
                                  key={time} 
                                  value={time}
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {time}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-400">
                                {selectedDate && selectedStaffId 
                                  ? 'Nenhum horário disponível' 
                                  : 'Selecione data e barbeiro'}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Observações adicionais (opcional)"
                          className="bg-[#1F2937] border-gray-600 text-white placeholder-[#9CA3AF]"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/cliente/dashboard')}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    disabled={submitting || isConfirming}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || isConfirming}
                    className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black"
                  >
                    {submitting || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isConfirming ? 'Confirmando...' : 'Agendando...'}
                      </>
                    ) : (
                      'Pré-confirmar Agendamento'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Modal de confirmação */}
        {isConfirming && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <Card className="bg-[#111827] border-gray-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Confirmar Agendamento</CardTitle>
                <CardDescription className="text-[#9CA3AF]">
                  Revise os detalhes do seu agendamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-gray-400">Serviço:</p>
                    <p className="text-white">
                      {selectedService?.name || 'Nenhum serviço selecionado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Barbeiro:</p>
                    <p className="text-white">
                      {barbers.find(b => b.id === form.getValues('staff_id'))?.name || 'Não selecionado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Data e Horário:</p>
                    <p className="text-white">
                      {selectedDate && form.getValues('time') 
                        ? `${format(selectedDate, "PPP", { locale: ptBR })} às ${form.getValues('time')}`
                        : 'Não selecionado'}
                    </p>
                  </div>
                  {form.getValues('notes') && (
                    <div>
                      <p className="text-gray-400">Observações:</p>
                      <p className="text-white">{form.getValues('notes')}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfirming(false)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    disabled={submitting}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleConfirmBooking(form.getValues())}
                    disabled={submitting}
                    className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Função auxiliar para adicionar meses (necessária para o calendário)
const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};