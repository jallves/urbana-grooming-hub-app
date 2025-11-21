import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden relative">
        {/* Background da barbearia - igual ao painel do cliente */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src={barbershopBg} 
            alt="Barbearia Costa Urbana Background" 
            className="w-full h-full object-cover"
          />
          {/* Dark overlay - Garante contraste e legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/80" />
        </div>

        {/* Animated background effects */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-urbana-gold-vibrant/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="flex flex-col h-full relative z-10">
          {/* Header */}
          <div className="p-3 sm:p-4 md:p-6 border-b border-urbana-gold/20 bg-urbana-black/60 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="hover:bg-urbana-gold/10 text-urbana-light hover:text-urbana-gold border border-urbana-gold/20 px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Voltar</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-red-500/10 text-urbana-light hover:text-red-400 border border-red-500/20 p-1.5 sm:p-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <div className="text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-light drop-shadow-lg">
                Novo Agendamento
              </h2>
              <p className="text-xs sm:text-sm text-urbana-light/70 mt-1">
                {step === 'client' && 'Selecione o cliente'}
                {step === 'service' && 'Escolha o serviço'}
                {step === 'barber' && 'Escolha o profissional'}
                {step === 'datetime' && 'Escolha data e horário'}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                step === 'client' 
                  ? 'bg-urbana-gold text-urbana-black border-urbana-gold shadow-lg shadow-urbana-gold/30' 
                  : 'bg-urbana-black/50 text-urbana-light border-urbana-gold/30'
              }`}>
                {step !== 'client' && selectedClient ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : '1'}
              </div>
              <div className={`w-8 sm:w-12 h-0.5 sm:h-1 rounded transition-all ${step !== 'client' ? 'bg-urbana-gold' : 'bg-urbana-gold/20'}`} />
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                step === 'service' 
                  ? 'bg-urbana-gold text-urbana-black border-urbana-gold shadow-lg shadow-urbana-gold/30' 
                  : step === 'barber' || step === 'datetime' 
                    ? 'bg-urbana-black/50 text-urbana-light border-urbana-gold/30' 
                    : 'bg-urbana-black/30 text-urbana-light/50 border-urbana-gold/20'
              }`}>
                {step === 'barber' || step === 'datetime' ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : '2'}
              </div>
              <div className={`w-8 sm:w-12 h-0.5 sm:h-1 rounded transition-all ${step === 'barber' || step === 'datetime' ? 'bg-urbana-gold' : 'bg-urbana-gold/20'}`} />
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                step === 'barber' 
                  ? 'bg-urbana-gold text-urbana-black border-urbana-gold shadow-lg shadow-urbana-gold/30' 
                  : step === 'datetime' 
                    ? 'bg-urbana-black/50 text-urbana-light border-urbana-gold/30' 
                    : 'bg-urbana-black/30 text-urbana-light/50 border-urbana-gold/20'
              }`}>
                {step === 'datetime' ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : '3'}
              </div>
              <div className={`w-8 sm:w-12 h-0.5 sm:h-1 rounded transition-all ${step === 'datetime' ? 'bg-urbana-gold' : 'bg-urbana-gold/20'}`} />
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                step === 'datetime' 
                  ? 'bg-urbana-gold text-urbana-black border-urbana-gold shadow-lg shadow-urbana-gold/30' 
                  : 'bg-urbana-black/30 text-urbana-light/50 border-urbana-gold/20'
              }`}>
                4
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            {/* Step 1: Client Selection */}
            {step === 'client' && (
              <div className="space-y-3 sm:space-y-4">
                <input
                  type="text"
                  placeholder="Buscar cliente por nome, telefone ou email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-urbana-gold/30 rounded-lg focus:ring-2 focus:ring-urbana-gold bg-urbana-black/50 backdrop-blur-sm text-urbana-light placeholder:text-urbana-light/50 text-sm sm:text-base"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {loading ? (
                    <div className="col-span-full text-center py-8 sm:py-12 text-urbana-light/70">
                      Carregando clientes...
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="col-span-full text-center py-8 sm:py-12 text-urbana-light/50">
                      Nenhum cliente encontrado
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <Card
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="cursor-pointer hover:shadow-lg hover:shadow-urbana-gold/20 hover:border-urbana-gold/50 transition-all bg-urbana-black/60 backdrop-blur-sm border-urbana-gold/20"
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-urbana-gold/20 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-urbana-light truncate text-sm sm:text-base">{client.nome}</p>
                              {client.email && (
                                <p className="text-xs text-urbana-light/70">{client.email}</p>
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
                  <div className="col-span-full text-center py-8 sm:py-12 text-urbana-light/70">
                    Carregando serviços...
                  </div>
                ) : services.length === 0 ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-urbana-light/50">
                    Nenhum serviço disponível
                  </div>
                ) : (
                  services.map((service) => (
                    <Card
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className="cursor-pointer hover:shadow-lg hover:shadow-urbana-gold/20 hover:border-urbana-gold/50 transition-all bg-urbana-black/60 backdrop-blur-sm border-urbana-gold/20"
                    >
                      <CardContent className="p-4 sm:p-6 text-center">
                        <Scissors className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-urbana-gold" />
                        <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-urbana-light">{service.nome}</h3>
                        <p className="text-xl sm:text-2xl font-bold text-urbana-gold">
                          R$ {service.preco.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-urbana-light/70 mt-1">
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
                  <div className="col-span-full text-center py-8 sm:py-12 text-urbana-light/70">
                    Carregando profissionais...
                  </div>
                ) : barbers.length === 0 ? (
                  <div className="col-span-full text-center py-8 sm:py-12 text-urbana-light/50">
                    Nenhum profissional disponível
                  </div>
                ) : (
                  barbers.map((barber) => (
                    <Card
                      key={barber.id}
                      onClick={() => handleBarberSelect(barber)}
                      className="cursor-pointer hover:shadow-lg hover:shadow-urbana-gold/20 hover:border-urbana-gold/50 transition-all bg-urbana-black/60 backdrop-blur-sm border-urbana-gold/20"
                    >
                      <CardContent className="p-4 sm:p-6 text-center">
                        {barber.image_url ? (
                          <img
                            src={barber.image_url}
                            alt={barber.nome}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-2 sm:mb-3 object-cover border-2 border-urbana-gold/50"
                          />
                        ) : (
                          <User className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 text-urbana-gold" />
                        )}
                        <h3 className="font-bold text-base sm:text-lg text-urbana-light">{barber.nome}</h3>
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
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 text-urbana-light">
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
                    Escolha a Data
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {loading ? (
                      <div className="col-span-full text-center py-6 sm:py-8 text-urbana-light/70">
                        Carregando datas...
                      </div>
                    ) : availableDates.length === 0 ? (
                      <div className="col-span-full text-center py-6 sm:py-8 text-urbana-light/50">
                        Nenhuma data disponível
                      </div>
                    ) : (
                      availableDates.map((date) => (
                        <Card
                          key={date.toISOString()}
                          onClick={() => handleDateSelect(date)}
                          className={`cursor-pointer transition-all bg-urbana-black/60 backdrop-blur-sm ${
                            selectedDate?.toDateString() === date.toDateString()
                              ? 'border-2 border-urbana-gold bg-urbana-gold/20 shadow-lg shadow-urbana-gold/30'
                              : 'border border-urbana-gold/20 hover:border-urbana-gold/50'
                          }`}
                        >
                          <CardContent className="p-3 sm:p-4 text-center">
                            <p className="text-xs text-urbana-light/70 capitalize">
                              {format(date, 'EEEE', { locale: ptBR })}
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-urbana-light">
                              {format(date, 'dd')}
                            </p>
                            <p className="text-xs sm:text-sm text-urbana-light/80 capitalize">
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
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 text-urbana-light">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold" />
                    Escolha o Horário
                  </h3>
                  {!selectedDate ? (
                    <div className="text-center text-urbana-light/50 py-6 sm:py-8">
                      Selecione uma data primeiro
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2">
                      {loading ? (
                        <div className="col-span-full text-center py-6 sm:py-8 text-urbana-light/70">
                          Carregando horários...
                        </div>
                      ) : timeSlots.filter(slot => slot.available).length === 0 ? (
                        <div className="col-span-full text-center py-6 sm:py-8 text-urbana-light/50">
                          Nenhum horário disponível
                        </div>
                      ) : (
                        timeSlots
                          .filter(slot => slot.available)
                          .map((slot) => (
                            <Card
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`cursor-pointer transition-all bg-urbana-black/60 backdrop-blur-sm ${
                                selectedTime === slot.time
                                  ? 'border-2 border-urbana-gold bg-urbana-gold/20 shadow-lg shadow-urbana-gold/30'
                                  : 'border border-urbana-gold/20 hover:border-urbana-gold/50'
                              }`}
                            >
                              <CardContent className="p-2 sm:p-3 text-center">
                                <p className="text-xs sm:text-sm font-bold text-urbana-light">
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
                    <Card className="border-2 border-urbana-gold/50 bg-urbana-black/70 backdrop-blur-sm shadow-xl shadow-urbana-gold/20">
                      <CardHeader className="p-3 sm:p-4 md:p-6">
                        <CardTitle className="text-lg sm:text-xl text-urbana-light">Resumo do Agendamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            <div>
                              <p className="text-xs text-urbana-light/70">Cliente</p>
                              <p className="font-semibold text-sm sm:text-base text-urbana-light">{selectedClient?.nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            <div>
                              <p className="text-xs text-urbana-light/70">Serviço</p>
                              <p className="font-semibold text-sm sm:text-base text-urbana-light">{selectedService?.nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            {selectedBarber?.image_url ? (
                              <img 
                                src={selectedBarber.image_url} 
                                alt={selectedBarber.nome}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-urbana-gold/50"
                              />
                            ) : (
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-xs text-urbana-light/70">Profissional</p>
                              <p className="font-semibold text-sm sm:text-base text-urbana-light">{selectedBarber?.nome}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            <div>
                              <p className="text-xs text-urbana-light/70">Data</p>
                              <p className="font-semibold text-sm sm:text-base text-urbana-light">
                                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 md:col-span-2">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold flex-shrink-0" />
                            <div>
                              <p className="text-xs text-urbana-light/70">Horário</p>
                              <p className="font-semibold text-sm sm:text-base text-urbana-light">{selectedTime}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleConfirm}
                          disabled={creating || isValidating}
                          className="w-full bg-gradient-to-r from-urbana-gold to-yellow-600 hover:from-yellow-600 hover:to-urbana-gold text-urbana-black font-bold py-4 sm:py-6 text-base sm:text-lg shadow-lg shadow-urbana-gold/30 border border-urbana-gold/50"
                        >
                          {creating || isValidating ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
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
