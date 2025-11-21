import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';
import { Calendar as CalendarIcon, Clock, Scissors, User, ArrowLeft, Check, X } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ClientAppointmentCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

interface Client {
  id: string;
  nome: string;
  email?: string;
}

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface Barber {
  id: string;
  staff_id: string;
  nome: string;
  image_url?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

// Schema de validação
const appointmentSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  servico_id: z.string().min(1, 'Serviço é obrigatório'),
  barbeiro_id: z.string().min(1, 'Barbeiro é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido')
});

const ClientAppointmentCreateDialog: React.FC<ClientAppointmentCreateDialogProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  console.log('🔵 [CreateDialog] Renderizando com isOpen:', isOpen);
  
  // Step control
  const [step, setStep] = useState<'client' | 'service' | 'barber' | 'datetime'>('client');
  
  // Selected data
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Lists
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const { getAvailableTimeSlots, validateAppointment, isValidating } = useAppointmentValidation();

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep('client');
    setSelectedClient(null);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setClientSearch('');
  };

  // Load clients
  useEffect(() => {
    if (isOpen && step === 'client') {
      loadClients();
    }
  }, [isOpen, step]);

  const loadClients = async () => {
    console.log('🔍 Iniciando carregamento de clientes...');
    console.log('🔵 [CreateDialog] Modal isOpen:', isOpen, 'Step:', step);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('id, nome, email')
        .order('nome');

      console.log('📊 Resposta da query de clientes:', { data, error });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }
      
      console.log(`✅ ${data?.length || 0} clientes carregados`);
      setClients(data || []);
      
      if (!data || data.length === 0) {
        toast.info('Nenhum cliente cadastrado ainda');
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast.error(error?.message || 'Erro ao carregar clientes');
      setClients([]); // Define lista vazia em caso de erro
    } finally {
      console.log('✅ Finalizando carregamento de clientes');
      setLoading(false);
    }
  };

  // Load services
  useEffect(() => {
    if (step === 'service') {
      loadServices();
    }
  }, [step]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select(`
          *,
          service_staff!inner(staff_id)
        `)
        .eq('is_active', true)
        .gt('preco', 0)
        .order('nome');

      if (error) throw error;
      
      // Remove duplicates
      const uniqueServices = (data || []).reduce((acc: Service[], curr: any) => {
        if (!acc.find(s => s.id === curr.id)) {
          acc.push({
            id: curr.id,
            nome: curr.nome,
            preco: curr.preco,
            duracao: curr.duracao
          });
        }
        return acc;
      }, []);
      
      setServices(uniqueServices);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  // Load barbers when service is selected
  useEffect(() => {
    if (step === 'barber' && selectedService) {
      loadBarbers();
    }
  }, [step, selectedService]);

  const loadBarbers = async () => {
    if (!selectedService) return;
    
    setLoading(true);
    try {
      const { data: serviceStaff, error: staffError } = await supabase
        .from('service_staff')
        .select('staff_id')
        .eq('service_id', selectedService.id);

      if (staffError) throw staffError;

      if (!serviceStaff || serviceStaff.length === 0) {
        setBarbers([]);
        toast.error('Nenhum barbeiro disponível para este serviço');
        return;
      }

      const staffIds = serviceStaff.map(s => s.staff_id);

      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('id, staff_id, nome, image_url')
        .eq('is_active', true)
        .in('staff_id', staffIds)
        .order('nome');

      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
      toast.error('Erro ao carregar barbeiros');
    } finally {
      setLoading(false);
    }
  };

  // Load available dates
  useEffect(() => {
    if (step === 'datetime' && selectedBarber && selectedService) {
      loadAvailableDates();
    }
  }, [step, selectedBarber, selectedService]);

  const loadAvailableDates = async () => {
    setLoading(true);
    try {
      const dates: Date[] = [];
      const today = startOfToday();
      
      for (let i = 0; dates.length < 10 && i < 30; i++) {
        const date = addDays(today, i);
        
        const slots = await getAvailableTimeSlots(
          selectedBarber!.staff_id,
          date,
          selectedService!.duracao
        );

        const availableCount = slots.filter(s => s.available).length;

        if (availableCount > 0) {
          dates.push(date);
        }
      }
      
      setAvailableDates(dates);
      
      if (dates.length === 0) {
        toast.warning(`Não há horários disponíveis para ${selectedBarber!.nome} nos próximos 30 dias`);
      }
    } catch (error) {
      console.error('Erro ao carregar datas disponíveis:', error);
      toast.error('Erro ao carregar datas disponíveis');
    } finally {
      setLoading(false);
    }
  };

  // Load time slots when date is selected
  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedBarber, selectedService]);

  const loadTimeSlots = async () => {
    if (!selectedDate || !selectedBarber || !selectedService) return;

    setLoading(true);
    try {
      const slots = await getAvailableTimeSlots(
        selectedBarber.staff_id,
        selectedDate,
        selectedService.duracao
      );
      
      const availableSlots = slots.filter(s => s.available);
      
      if (availableSlots.length === 0) {
        toast.info(`Nenhum horário disponível para ${selectedBarber.nome} nesta data`);
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setStep('service');
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('barber');
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep('datetime');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleBack = () => {
    if (step === 'service') {
      setStep('client');
      setSelectedService(null);
      setSelectedBarber(null);
      setSelectedDate(null);
      setSelectedTime(null);
    } else if (step === 'barber') {
      setStep('service');
      setSelectedBarber(null);
      setSelectedDate(null);
      setSelectedTime(null);
    } else if (step === 'datetime') {
      setStep('barber');
      setSelectedDate(null);
      setSelectedTime(null);
    } else {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!selectedClient || !selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Selecione todos os campos');
      return;
    }

    setCreating(true);
    let progressToast: string | number | undefined;

    try {
      // Validar dados com zod
      const validationResult = appointmentSchema.safeParse({
        cliente_id: selectedClient.id,
        servico_id: selectedService.id,
        barbeiro_id: selectedBarber.id,
        data: format(selectedDate, 'yyyy-MM-dd'),
        hora: selectedTime
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(', ');
        toast.error(errors);
        return;
      }

      progressToast = toast.loading('⏳ Validando disponibilidade...');

      // Validar disponibilidade
      const validation = await validateAppointment(
        selectedBarber.staff_id,
        selectedDate,
        selectedTime,
        selectedService.duracao
      );

      if (!validation.valid) {
        if (progressToast) toast.dismiss(progressToast);
        toast.error(validation.error || 'Horário não disponível');
        await loadTimeSlots();
        return;
      }

      if (progressToast) toast.dismiss(progressToast);
      progressToast = toast.loading('📝 Criando agendamento...');

      // Criar agendamento
      const { data: appointmentData, error: insertError } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: selectedClient.id,
          barbeiro_id: selectedBarber.id,
          servico_id: selectedService.id,
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedTime,
          status: 'confirmado'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir agendamento:', insertError);
        throw insertError;
      }

      if (progressToast) toast.dismiss(progressToast);
      toast.success('Agendamento criado com sucesso!');
      
      onCreate();
      resetForm();
      onClose();

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      if (progressToast) toast.dismiss(progressToast);
      
      let errorMessage = 'Erro ao criar agendamento';
      
      if (error.code === '23505') {
        errorMessage = 'Já existe um agendamento neste horário';
      } else if (error.code === '23503') {
        errorMessage = 'Erro de referência no banco de dados';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      await loadTimeSlots();
    } finally {
      setCreating(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.nome.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  console.log('🎨 [CreateDialog] Renderizando Dialog. isOpen:', isOpen, 'loading:', loading, 'step:', step, 'clients:', clients.length);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] p-0 overflow-hidden bg-white border-2 border-gray-300 shadow-2xl"
        style={{ zIndex: 9999 }}
      >
        <div className="absolute top-2 right-2 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-red-50 text-gray-700 hover:text-red-600 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <VisuallyHidden>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Crie um novo agendamento selecionando cliente, serviço, barbeiro e horário
          </DialogDescription>
        </VisuallyHidden>

        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>

            <div className="text-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Novo Agendamento
              </h2>
              <p className="text-sm text-gray-600">
                {step === 'client' && 'Selecione o cliente'}
                {step === 'service' && 'Escolha o serviço'}
                {step === 'barber' && 'Escolha o profissional'}
                {step === 'datetime' && 'Escolha data e horário'}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                step === 'client' 
                  ? 'bg-urbana-gold text-white border-urbana-gold' 
                  : 'bg-gray-100 text-gray-900 border-gray-300'
              }`}>
                {step !== 'client' && selectedClient ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className={`w-12 h-1 rounded ${step !== 'client' ? 'bg-urbana-gold' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                step === 'service' 
                  ? 'bg-urbana-gold text-white border-urbana-gold' 
                  : step === 'barber' || step === 'datetime' 
                    ? 'bg-gray-100 text-gray-900 border-gray-300' 
                    : 'bg-white text-gray-400 border-gray-200'
              }`}>
                {step === 'barber' || step === 'datetime' ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className={`w-12 h-1 rounded ${step === 'barber' || step === 'datetime' ? 'bg-urbana-gold' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                step === 'barber' 
                  ? 'bg-urbana-gold text-white border-urbana-gold' 
                  : step === 'datetime' 
                    ? 'bg-gray-100 text-gray-900 border-gray-300' 
                    : 'bg-white text-gray-400 border-gray-200'
              }`}>
                {step === 'datetime' ? <Check className="w-4 h-4" /> : '3'}
              </div>
              <div className={`w-12 h-1 rounded ${step === 'datetime' ? 'bg-urbana-gold' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                step === 'datetime' 
                  ? 'bg-urbana-gold text-white border-urbana-gold' 
                  : 'bg-white text-gray-400 border-gray-200'
              }`}>
                4
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50">
            {/* Step 1: Client Selection */}
            {step === 'client' && (
              <div className="space-y-3 sm:space-y-4">
                <input
                  type="text"
                  placeholder="Buscar cliente por nome, telefone ou email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-urbana-gold bg-white text-gray-900 placeholder:text-gray-500 text-sm sm:text-base"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {loading ? (
                    <div className="col-span-full text-center py-8 sm:py-12 text-gray-600">
                      Carregando clientes...
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
                      Nenhum cliente encontrado
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <Card
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="cursor-pointer hover:shadow-lg hover:border-urbana-gold transition-all bg-white border-gray-200"
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-urbana-gold/20 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{client.nome}</p>
                              {client.email && (
                                <p className="text-xs text-gray-600">{client.email}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Service Selection */}
            {step === 'service' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {loading ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-gray-600">
                    Carregando serviços...
                  </div>
                ) : services.length === 0 ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
                    Nenhum serviço disponível
                  </div>
                ) : (
                  services.map((service) => (
                    <Card
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className="cursor-pointer hover:shadow-lg hover:border-urbana-gold transition-all bg-white border-gray-200"
                    >
                      <CardContent className="p-4 sm:p-6 text-center">
                        <Scissors className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-urbana-gold" />
                        <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-gray-900">{service.nome}</h3>
                        <p className="text-xl sm:text-2xl font-bold text-urbana-gold">
                          R$ {service.preco.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {service.duracao} minutos
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Step 3: Barber Selection */}
            {step === 'barber' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {loading ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-gray-600">
                    Carregando profissionais...
                  </div>
                ) : barbers.length === 0 ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
                    Nenhum profissional disponível
                  </div>
                ) : (
                  barbers.map((barber) => (
                    <Card
                      key={barber.id}
                      onClick={() => handleBarberSelect(barber)}
                      className="cursor-pointer hover:shadow-lg hover:border-urbana-gold transition-all bg-white border-gray-200"
                    >
                      <CardContent className="p-4 sm:p-6 text-center">
                        {barber.image_url ? (
                          <img
                            src={barber.image_url}
                            alt={barber.nome}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-2 sm:mb-3 object-cover border-2 border-urbana-gold"
                          />
                        ) : (
                          <User className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 text-urbana-gold" />
                        )}
                        <h3 className="font-bold text-base sm:text-lg text-gray-900">{barber.nome}</h3>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Step 4: Date & Time Selection */}
            {step === 'datetime' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Date Selection */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900">
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
                    Escolha a Data
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {loading ? (
                      <div className="col-span-full text-center py-6 sm:py-8 text-gray-600">
                        Carregando datas...
                      </div>
                    ) : availableDates.length === 0 ? (
                      <div className="col-span-full text-center py-6 sm:py-8 text-gray-500">
                        Nenhuma data disponível
                      </div>
                    ) : (
                      availableDates.map((date) => (
                        <Card
                          key={date.toISOString()}
                          onClick={() => handleDateSelect(date)}
                          className={`cursor-pointer transition-all bg-white ${
                            selectedDate?.toDateString() === date.toDateString()
                              ? 'border-2 border-urbana-gold shadow-lg'
                              : 'border border-gray-200 hover:border-urbana-gold'
                          }`}
                        >
                          <CardContent className="p-3 sm:p-4 text-center">
                            <p className="text-xs text-gray-600 capitalize">
                              {format(date, 'EEEE', { locale: ptBR })}
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                              {format(date, 'dd')}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-700 capitalize">
                              {format(date, 'MMM', { locale: ptBR })}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
                    Escolha o Horário
                  </h3>
                  {!selectedDate ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8">
                      Selecione uma data primeiro
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2">
                      {loading ? (
                        <div className="col-span-full text-center py-6 sm:py-8 text-gray-600">
                          Carregando horários...
                        </div>
                      ) : timeSlots.filter(slot => slot.available).length === 0 ? (
                        <div className="col-span-full text-center py-6 sm:py-8 text-gray-500">
                          Nenhum horário disponível
                        </div>
                      ) : (
                        timeSlots
                          .filter(slot => slot.available)
                          .map((slot) => (
                            <Card
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`cursor-pointer transition-all bg-white ${
                                selectedTime === slot.time
                                  ? 'border-2 border-urbana-gold shadow-lg'
                                  : 'border border-gray-200 hover:border-urbana-gold'
                              }`}
                            >
                              <CardContent className="p-2 sm:p-3 text-center">
                                <p className="text-xs sm:text-sm font-bold text-gray-900">
                                  {slot.time}
                                </p>
                              </CardContent>
                            </Card>
                          ))
                      )}
                    </div>
                  )}
                </div>

                {/* Summary & Confirm */}
                {selectedDate && selectedTime && (
                  <div className="lg:col-span-2 mt-4 sm:mt-6">
                    <Card className="border-2 border-urbana-gold bg-white shadow-xl">
                      <CardHeader className="p-3 sm:p-4 md:p-6">
                        <CardTitle className="text-lg sm:text-xl text-gray-900">Resumo do Agendamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Cliente</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-900">{selectedClient?.nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Serviço</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-900">{selectedService?.nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            {selectedBarber?.image_url ? (
                              <img 
                                src={selectedBarber.image_url} 
                                alt={selectedBarber.nome}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-urbana-gold"
                              />
                            ) : (
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-xs text-gray-600">Profissional</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-900">{selectedBarber?.nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Data</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-900">
                                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 md:col-span-2">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Horário</p>
                              <p className="font-semibold text-sm sm:text-base text-gray-900">{selectedTime}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleConfirm}
                          disabled={creating || isValidating}
                          className="w-full bg-gradient-to-r from-urbana-gold to-yellow-600 hover:from-yellow-600 hover:to-urbana-gold text-white font-bold py-4 sm:py-6 text-base sm:text-lg shadow-lg"
                        >
                          {creating || isValidating ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                              <span className="text-sm sm:text-base">Confirmando...</span>
                            </span>
                          ) : (
                            <>
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                              <span className="text-sm sm:text-base">Confirmar Agendamento</span>
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAppointmentCreateDialog;
