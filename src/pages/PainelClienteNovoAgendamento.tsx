import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Scissors, User, ArrowLeft, Check } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';
import { TotemCard, TotemCardTitle } from '@/components/totem/TotemCard';
import { TotemGrid } from '@/components/totem/TotemLayout';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface Barber {
  id: string;
  nome: string;
  image_url?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

const PainelClienteNovoAgendamento: React.FC = () => {
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const [step, setStep] = useState<'service' | 'barber' | 'datetime'>('service');
  
  // State para os dados do agendamento
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // State para listas
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  // State para loading
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const { getAvailableTimeSlots, validateAppointment, isValidating } = useAppointmentValidation();

  // Carregar serviços
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('*')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  // Carregar barbeiros quando avançar para step de barbeiro
  useEffect(() => {
    if (step === 'barber' && selectedService) {
      loadBarbers();
    }
  }, [step, selectedService]);

  const loadBarbers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('*')
        .eq('is_active', true)
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

  // Carregar datas disponíveis quando avançar para step de data/hora
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
      
      // Carregar até 10 dias disponíveis
      for (let i = 0; dates.length < 10 && i < 30; i++) {
        const date = addDays(today, i);
        
        // Buscar horários disponíveis para esta data
        const slots = await getAvailableTimeSlots(
          selectedBarber!.id,
          date,
          selectedService!.duracao
        );

        // Se tem pelo menos 1 horário disponível, adicionar a data
        if (slots.some(slot => slot.available)) {
          dates.push(date);
        }
      }
      
      setAvailableDates(dates);
      
      // Se não há datas disponíveis
      if (dates.length === 0) {
        toast.warning('Não há horários disponíveis para este barbeiro nos próximos dias');
      }
    } catch (error) {
      console.error('Erro ao carregar datas disponíveis:', error);
      toast.error('Erro ao carregar datas disponíveis');
    } finally {
      setLoading(false);
    }
  };

  // Carregar horários quando selecionar uma data
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
        selectedBarber.id,
        selectedDate,
        selectedService.duracao
      );
      setTimeSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setLoading(false);
    }
  };

  // Handler para selecionar serviço - avança automaticamente
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('barber');
  };

  // Handler para selecionar barbeiro - avança automaticamente
  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep('datetime');
  };

  // Handler para selecionar data
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  // Handler para confirmar agendamento
  const handleConfirm = async () => {
    if (!client) {
      toast.error('Cliente não autenticado');
      navigate('/painel-cliente/login');
      return;
    }

    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Selecione todos os campos');
      return;
    }

    setCreating(true);

    try {
      // Validar disponibilidade final
      const validation = await validateAppointment(
        selectedBarber.id,
        selectedDate,
        selectedTime,
        selectedService.duracao
      );

      if (!validation.valid) {
        toast.error(validation.error || 'Horário não disponível');
        await loadTimeSlots();
        return;
      }

      // Calcular end_time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + selectedService.duracao);

      // Criar agendamento
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          client_id: client.id,
          service_id: selectedService.id,
          staff_id: selectedBarber.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed'
        });

      if (insertError) throw insertError;

      toast.success('Agendamento criado com sucesso!');
      navigate('/painel-cliente/agendamentos');
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error.message || 'Erro ao criar agendamento');
    } finally {
      setCreating(false);
    }
  };

  // Handler para voltar
  const handleBack = () => {
    if (step === 'barber') {
      setStep('service');
      setSelectedBarber(null);
      setSelectedDate(null);
      setSelectedTime(null);
    } else if (step === 'datetime') {
      setStep('barber');
      setSelectedDate(null);
      setSelectedTime(null);
    } else {
      navigate('/painel-cliente/dashboard');
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background com imagem */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${barbershopBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Overlay escuro */}
      <div className="fixed inset-0 bg-black/70 z-0" />
      
      {/* Animated background effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-urbana-gold/10 rounded-full blur-3xl animate-pulse-slow" 
          style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm sm:text-base">Voltar</span>
            </button>

            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-urbana-gold drop-shadow-lg mb-2">
                Novo Agendamento
              </h1>
              <p className="text-white/80 text-sm sm:text-base">
                {step === 'service' && 'Escolha o serviço desejado'}
                {step === 'barber' && 'Escolha seu profissional'}
                {step === 'datetime' && 'Escolha a data e horário'}
              </p>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'service' ? 'bg-urbana-gold text-black' : 'bg-white/20 text-white'
              }`}>
                {step !== 'service' && selectedService ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className={`w-12 h-1 rounded ${step !== 'service' ? 'bg-urbana-gold' : 'bg-white/20'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'barber' ? 'bg-urbana-gold text-black' : step === 'datetime' ? 'bg-white/20 text-white' : 'bg-white/20 text-white/50'
              }`}>
                {step === 'datetime' && selectedBarber ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className={`w-12 h-1 rounded ${step === 'datetime' ? 'bg-urbana-gold' : 'bg-white/20'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === 'datetime' ? 'bg-urbana-gold text-black' : 'bg-white/20 text-white/50'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 pb-20">
          <div className="max-w-7xl mx-auto">
            {/* Step 1: Service Selection */}
            {step === 'service' && (
              <TotemGrid columns={3} gap={4}>
                {loading ? (
                  <div className="col-span-full text-center text-white py-12">
                    Carregando serviços...
                  </div>
                ) : services.length === 0 ? (
                  <div className="col-span-full text-center text-white/60 py-12">
                    Nenhum serviço disponível
                  </div>
                ) : (
                  services.map((service, index) => (
                    <TotemCard
                      key={service.id}
                      icon={Scissors}
                      onClick={() => handleServiceSelect(service)}
                      variant="default"
                      animationDelay={`${index * 0.1}s`}
                    >
                      <TotemCardTitle>{service.nome}</TotemCardTitle>
                      <p className="text-2xl sm:text-3xl font-bold text-urbana-gold mt-2">
                        R$ {service.preco.toFixed(2)}
                      </p>
                      <p className="text-sm text-white/60 mt-1">
                        {service.duracao} minutos
                      </p>
                    </TotemCard>
                  ))
                )}
              </TotemGrid>
            )}

            {/* Step 2: Barber Selection */}
            {step === 'barber' && (
              <TotemGrid columns={3} gap={4}>
                {loading ? (
                  <div className="col-span-full text-center text-white py-12">
                    Carregando profissionais...
                  </div>
                ) : barbers.length === 0 ? (
                  <div className="col-span-full text-center text-white/60 py-12">
                    Nenhum profissional disponível
                  </div>
                ) : (
                  barbers.map((barber, index) => (
                    <TotemCard
                      key={barber.id}
                      icon={User}
                      onClick={() => handleBarberSelect(barber)}
                      variant="default"
                      animationDelay={`${index * 0.1}s`}
                    >
                      {barber.image_url && (
                        <img
                          src={barber.image_url}
                          alt={barber.nome}
                          className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-urbana-gold/50"
                        />
                      )}
                      <TotemCardTitle className="text-center">{barber.nome}</TotemCardTitle>
                    </TotemCard>
                  ))
                )}
              </TotemGrid>
            )}

            {/* Step 3: Date & Time Selection */}
            {step === 'datetime' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-urbana-gold" />
                    Escolha a Data
                  </h3>
                  <TotemGrid columns={2} gap={2}>
                    {loading ? (
                      <div className="col-span-full text-center text-white py-8">
                        Carregando datas...
                      </div>
                    ) : availableDates.length === 0 ? (
                      <div className="col-span-full text-center text-white/60 py-8">
                        Nenhuma data disponível
                      </div>
                    ) : (
                      availableDates.map((date, index) => (
                        <TotemCard
                          key={date.toISOString()}
                          onClick={() => handleDateSelect(date)}
                          variant={selectedDate?.toDateString() === date.toDateString() ? 'selected' : 'default'}
                          animationDelay={`${index * 0.05}s`}
                        >
                          <div className="text-center">
                            <p className="text-sm text-white/60 capitalize">
                              {format(date, 'EEEE', { locale: ptBR })}
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {format(date, 'dd')}
                            </p>
                            <p className="text-sm text-white/80 capitalize">
                              {format(date, 'MMM', { locale: ptBR })}
                            </p>
                          </div>
                        </TotemCard>
                      ))
                    )}
                  </TotemGrid>
                </div>

                {/* Time Selection */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-urbana-gold" />
                    Escolha o Horário
                  </h3>
                  {!selectedDate ? (
                    <div className="text-center text-white/60 py-8">
                      Selecione uma data primeiro
                    </div>
                  ) : (
                    <TotemGrid columns={3} gap={2}>
                      {loading ? (
                        <div className="col-span-full text-center text-white py-8">
                          Carregando horários...
                        </div>
                      ) : timeSlots.filter(slot => slot.available).length === 0 ? (
                        <div className="col-span-full text-center text-white/60 py-8">
                          Nenhum horário disponível
                        </div>
                      ) : (
                        timeSlots
                          .filter(slot => slot.available)
                          .map((slot, index) => (
                            <TotemCard
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              variant={selectedTime === slot.time ? 'selected' : 'default'}
                              animationDelay={`${index * 0.02}s`}
                            >
                              <div className="text-center">
                                <p className="text-lg font-bold text-white">
                                  {slot.time}
                                </p>
                              </div>
                            </TotemCard>
                          ))
                      )}
                    </TotemGrid>
                  )}
                </div>

                {/* Summary & Confirm */}
                {selectedDate && selectedTime && (
                  <div className="lg:col-span-2 mt-6">
                    <Card className="bg-white/10 backdrop-blur-md border-2 border-urbana-gold/50">
                      <CardHeader>
                        <CardTitle className="text-white">Resumo do Agendamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 text-white">
                          <Scissors className="w-5 h-5 text-urbana-gold" />
                          <div>
                            <p className="text-sm text-white/60">Serviço</p>
                            <p className="font-semibold">{selectedService?.nome}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                          <User className="w-5 h-5 text-urbana-gold" />
                          <div>
                            <p className="text-sm text-white/60">Profissional</p>
                            <p className="font-semibold">{selectedBarber?.nome}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                          <CalendarIcon className="w-5 h-5 text-urbana-gold" />
                          <div>
                            <p className="text-sm text-white/60">Data</p>
                            <p className="font-semibold">
                              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-white">
                          <Clock className="w-5 h-5 text-urbana-gold" />
                          <div>
                            <p className="text-sm text-white/60">Horário</p>
                            <p className="font-semibold">{selectedTime}</p>
                          </div>
                        </div>
                        <Button
                          onClick={handleConfirm}
                          disabled={creating || isValidating}
                          className="w-full mt-4 bg-urbana-gold text-black hover:bg-urbana-gold/90 font-bold py-6 text-lg"
                        >
                          {creating || isValidating ? 'Confirmando...' : 'Confirmar Agendamento'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PainelClienteNovoAgendamento;
