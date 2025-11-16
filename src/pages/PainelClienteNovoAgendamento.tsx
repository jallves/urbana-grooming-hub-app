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
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
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
  staff_id: string;
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
  const { cliente } = usePainelClienteAuth();
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
        .select('id, staff_id, nome, image_url')
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
      console.log('🔍 Iniciando loadAvailableDates', {
        selectedBarber: selectedBarber?.nome,
        staff_id: selectedBarber?.staff_id,
        selectedService: selectedService?.nome,
        serviceDuration: selectedService?.duracao
      });

      const dates: Date[] = [];
      const today = startOfToday();
      
      // Carregar até 10 dias disponíveis (buscar em até 30 dias)
      for (let i = 0; dates.length < 10 && i < 30; i++) {
        const date = addDays(today, i);
        
        console.log(`📅 Verificando data: ${format(date, 'dd/MM/yyyy')} para barbeiro ${selectedBarber!.nome}`);
        
        // Buscar horários disponíveis PARA ESTE BARBEIRO ESPECÍFICO
        const slots = await getAvailableTimeSlots(
          selectedBarber!.staff_id,
          date,
          selectedService!.duracao
        );

        const availableCount = slots.filter(s => s.available).length;
        console.log(`   → ${slots.length} slots totais, ${availableCount} disponíveis para ${selectedBarber!.nome}`);

        // Se tem pelo menos 1 horário disponível, adicionar a data
        if (availableCount > 0) {
          dates.push(date);
        }
      }
      
      console.log(`✅ Total de datas disponíveis para ${selectedBarber!.nome}: ${dates.length}`);
      setAvailableDates(dates);
      
      // Se não há datas disponíveis
      if (dates.length === 0) {
        toast.warning(`Não há horários disponíveis para ${selectedBarber!.nome} nos próximos 30 dias`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar datas disponíveis:', error);
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
      console.log('🕐 Carregando horários disponíveis:', {
        barbeiro: selectedBarber.nome,
        staff_id: selectedBarber.staff_id,
        data: format(selectedDate, 'dd/MM/yyyy'),
        servico: selectedService.nome,
        duracao: selectedService.duracao
      });

      // Buscar slots ESPECÍFICOS para este barbeiro
      const slots = await getAvailableTimeSlots(
        selectedBarber.staff_id,
        selectedDate,
        selectedService.duracao
      );
      
      console.log(`📋 Slots para ${selectedBarber.nome}:`, {
        total: slots.length,
        disponiveis: slots.filter(s => s.available).length,
        ocupados: slots.filter(s => !s.available).length,
        detalhes: slots.map(s => ({ 
          time: s.time, 
          available: s.available, 
          reason: s.reason 
        }))
      });

      // Mostrar apenas horários disponíveis
      const availableSlots = slots.filter(s => s.available);
      
      if (availableSlots.length === 0) {
        toast.info(`Nenhum horário disponível para ${selectedBarber.nome} nesta data. Tente outra data.`);
      } else {
        console.log(`✅ ${availableSlots.length} horários disponíveis para ${selectedBarber.nome}`);
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('❌ Erro ao carregar horários:', error);
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
    if (!cliente) {
      toast.error('Cliente não autenticado');
      navigate('/painel-cliente/login');
      return;
    }

    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Selecione todos os campos');
      return;
    }

    setCreating(true);
    let progressToast: string | number | undefined;

    try {
      console.log('🚀 Iniciando confirmação de agendamento', {
        cliente: cliente.nome,
        barbeiro: selectedBarber.nome,
        servico: selectedService.nome,
        data: format(selectedDate, 'dd/MM/yyyy'),
        hora: selectedTime
      });

      // Mostrar toast de progresso
      progressToast = toast.loading('⏳ Validando disponibilidade...');

      // 1. Validar disponibilidade final
      const validation = await validateAppointment(
        selectedBarber.staff_id,
        selectedDate,
        selectedTime,
        selectedService.duracao
      );

      if (!validation.valid) {
        console.error('❌ Validação falhou:', validation.error);
        if (progressToast) toast.dismiss(progressToast);
        toast.error(validation.error || 'Horário não disponível');
        await loadTimeSlots(); // Recarregar horários disponíveis
        return;
      }

      console.log('✅ Validação OK, criando agendamento...');
      
      // Atualizar progresso
      if (progressToast) toast.dismiss(progressToast);
      progressToast = toast.loading('📝 Criando agendamento...');

      // 2. Calcular horários
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + selectedService.duracao);

      console.log('📅 Horários calculados:', {
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      });

      // 3. Criar agendamento no banco
      const { data: appointmentData, error: insertError } = await supabase
        .from('appointments')
        .insert({
          client_id: cliente.id,
          service_id: selectedService.id,
          staff_id: selectedBarber.staff_id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'scheduled'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir agendamento:', insertError);
        throw insertError;
      }

      console.log('✅ Agendamento criado com sucesso!', appointmentData);

      // Sucesso!
      if (progressToast) toast.dismiss(progressToast);
      
      const dateFormatted = selectedDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
      });
      
      toast.success(
        `🎉 Agendamento confirmado!\n\n${selectedService.nome} com ${selectedBarber.nome}\n${dateFormatted} às ${selectedTime}`,
        { 
          duration: 6000,
          style: {
            background: 'hsl(142, 76%, 36%)',
            color: 'white',
            border: '2px solid hsl(142, 76%, 46%)',
            fontSize: '16px',
            fontWeight: 'bold',
          }
        }
      );

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/painel-cliente/agendamentos');
      }, 2000);

    } catch (error: any) {
      console.error('💥 Erro ao criar agendamento:', error);
      if (progressToast) toast.dismiss(progressToast);
      
      let errorMessage = 'Erro ao criar agendamento. Tente novamente.';
      
      // Tratar erros específicos
      if (error.code === '23514') {
        errorMessage = 'Erro de validação no agendamento. Tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: 'hsl(var(--destructive))',
          color: 'hsl(var(--destructive-foreground))',
          border: '1px solid hsl(var(--destructive))',
        }
      });
      
      // Recarregar horários para mostrar estado atualizado
      await loadTimeSlots();
    } finally {
      // CRÍTICO: Sempre resetar o estado de loading
      setCreating(false);
      console.log('🏁 Processo de agendamento finalizado');
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
      <img 
        src={barbershopBg}
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover z-0"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
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
                          {selectedBarber?.image_url ? (
                            <img 
                              src={selectedBarber.image_url} 
                              alt={selectedBarber.nome}
                              className="w-12 h-12 rounded-full object-cover border-2 border-urbana-gold/50"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <User className="w-5 h-5 text-urbana-gold" />
                          )}
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
                          className="w-full mt-4 bg-urbana-gold text-black hover:bg-urbana-gold/90 font-bold py-6 text-lg relative overflow-hidden"
                        >
                          {creating || isValidating ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                              Confirmando...
                            </span>
                          ) : (
                            <>
                              <Check className="w-5 h-5 mr-2 inline" />
                              Confirmar Agendamento
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
      </div>
    </div>
  );
};

export default PainelClienteNovoAgendamento;
