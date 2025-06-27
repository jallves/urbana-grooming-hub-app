import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
import ClientStaffSelect from './client/ClientStaffSelect';
import { Calendar as CalendarIcon, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  staff_id: z.string().min(1, 'Barbeiro é obrigatório'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  time: z.string().min(1, 'Horário é obrigatório'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export const ClientBookingForm: React.FC = () => {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<any>(null);
  
  const { services, barbers, loading } = useClientFormData();
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

  useEffect(() => {
    if (!client) {
      navigate('/cliente/login');
      return;
    }
  }, [client, navigate]);

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service);
  };

  const onSubmit = async (data: FormData) => {
    // Ensure all required fields are present before submitting
    if (!data.service_id || !data.staff_id || !data.date || !data.time) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    await submitForm(data, selectedService);
  };

  // Generate time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  if (!client) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  const selectedDate = form.watch('date');
  const selectedTime = form.watch('time');

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
              Agende seu horário com barbeiros disponíveis
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
                    serviceDuration={selectedService?.duration}
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
                                // Reset staff selection when date changes
                                form.setValue('staff_id', '');
                              }}
                              disabled={(date) => date < new Date() || date.getDay() === 0}
                              initialFocus
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
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset staff selection when time changes
                            form.setValue('staff_id', '');
                          }}
                          value={field.value || ""}
                          disabled={!selectedDate}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
                              <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1F2937] border-gray-600">
                            {timeSlots.map((time) => (
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
                            ))}
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
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-black"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
