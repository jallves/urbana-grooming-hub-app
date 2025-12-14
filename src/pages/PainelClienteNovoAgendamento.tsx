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
import SuccessConfirmationDialog from '@/components/client/appointment/SuccessConfirmationDialog';
import barbershopBg from '@/assets/barbershop-background.jpg';
import { ClientPageContainer } from "@/components/painel-cliente/ClientPageContainer";
import { sendAppointmentConfirmationEmail } from '@/hooks/useSendAppointmentEmail';

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
        .select(`
          *,
          service_staff!inner(staff_id)
        `)
        .eq('is_active', true)
        .gt('preco', 0)
        .order('nome');

      if (error) throw error;
      
      // Remove duplicates (serviços com múltiplos barbeiros)
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

  // Carregar barbeiros quando avançar para step de barbeiro
  useEffect(() => {
    if (step === 'barber' && selectedService) {
      loadBarbers();
    }
  }, [step, selectedService]);

  const loadBarbers = async () => {
    if (!selectedService) return;
    
    setLoading(true);
    try {
      // Buscar apenas barbeiros vinculados ao serviço selecionado
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

      // Buscar dados dos barbeiros vinculados
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('id, staff_id, nome, image_url')
        .eq('is_active', true)
        .eq('available_for_booking', true)
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

      // 2. Criar agendamento na tabela CORRETA (painel_agendamentos)
      const { data: appointmentData, error: insertError } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: cliente.id,
          barbeiro_id: selectedBarber.id,
          servico_id: selectedService.id,
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedTime,
          status: 'agendado'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir agendamento:', insertError);
        throw insertError;
      }

      console.log('✅ Agendamento criado com sucesso!', appointmentData);

      // Enviar e-mail de confirmação (aguardar para garantir envio)
      if (appointmentData?.id) {
        console.log('📧 Iniciando envio de e-mail para agendamento:', appointmentData.id);
        try {
          const emailSent = await sendAppointmentConfirmationEmail(appointmentData.id);
          if (emailSent) {
            console.log('📧 E-mail de confirmação enviado com sucesso!');
          } else {
            console.log('📧 E-mail não enviado (cliente sem e-mail válido ou erro)');
          }
        } catch (emailError) {
          console.error('❌ Erro ao enviar e-mail de confirmação:', emailError);
        }
      } else {
        console.log('⚠️ Agendamento sem ID, não é possível enviar e-mail');
      }

      // Sucesso! Mostrar modal de confirmação
      if (progressToast) toast.dismiss(progressToast);
      setShowSuccessDialog(true);

    } catch (error: any) {
      console.error('💥 Erro ao criar agendamento:', error);
      if (progressToast) toast.dismiss(progressToast);
      
      let errorMessage = 'Erro ao criar agendamento. Tente novamente.';
      
      // Tratar erros específicos do banco
      if (error.code === '23505') {
        errorMessage = 'Já existe um agendamento neste horário.';
      } else if (error.code === '23503') {
        errorMessage = 'Erro de referência no banco de dados.';
        console.error('🔴 Erro de foreign key:', {
          cliente_id: cliente?.id,
          barbeiro_id: selectedBarber?.id,
          servico_id: selectedService?.id
        });
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
    <ClientPageContainer>
      {/* Indicador de Progresso - Mobile Responsive */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-2">
          {/* Passo 1 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all mb-1 sm:mb-2 ${
              step === 'service' ? 'bg-urbana-gold text-black scale-110' : selectedService ? 'bg-urbana-gold/30 text-white' : 'bg-white/20 text-white/50'
            }`}>
              {selectedService ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : '1'}
            </div>
            <p className={`text-[10px] sm:text-xs text-center font-medium leading-tight ${step === 'service' ? 'text-urbana-gold' : 'text-white/60'}`}>
              Serviço
            </p>
          </div>

          {/* Linha 1-2 */}
          <div className={`h-0.5 sm:h-1 flex-1 mx-1 sm:mx-2 rounded transition-all ${selectedService ? 'bg-urbana-gold' : 'bg-white/20'}`} />

          {/* Passo 2 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all mb-1 sm:mb-2 ${
              step === 'barber' ? 'bg-urbana-gold text-black scale-110' : selectedBarber ? 'bg-urbana-gold/30 text-white' : 'bg-white/20 text-white/50'
            }`}>
              {selectedBarber ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : '2'}
            </div>
            <p className={`text-[10px] sm:text-xs text-center font-medium leading-tight ${step === 'barber' ? 'text-urbana-gold' : 'text-white/60'}`}>
              Profissional
            </p>
          </div>

          {/* Linha 2-3 */}
          <div className={`h-0.5 sm:h-1 flex-1 mx-1 sm:mx-2 rounded transition-all ${selectedBarber ? 'bg-urbana-gold' : 'bg-white/20'}`} />

          {/* Passo 3 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all mb-1 sm:mb-2 ${
              step === 'datetime' ? 'bg-urbana-gold text-black scale-110' : (selectedDate && selectedTime) ? 'bg-urbana-gold/30 text-white' : 'bg-white/20 text-white/50'
            }`}>
              {(selectedDate && selectedTime) ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : '3'}
            </div>
            <p className={`text-[10px] sm:text-xs text-center font-medium leading-tight ${step === 'datetime' ? 'text-urbana-gold' : 'text-white/60'}`}>
              Data e Hora
            </p>
          </div>
        </div>
      </div>

      {/* Resumo das Seleções - Mobile Optimized */}
      {(selectedService || selectedBarber || (selectedDate && selectedTime)) && (
        <Card className="mb-4 sm:mb-6 bg-white/5 backdrop-blur-sm border border-urbana-gold/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
              {selectedService && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-urbana-gold/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                  <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-urbana-gold flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-white truncate">{selectedService.nome}</span>
                </div>
              )}
              {selectedBarber && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-urbana-gold/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                  {selectedBarber.image_url ? (
                    <img src={selectedBarber.image_url} alt={selectedBarber.nome} className="w-6 h-6 rounded-full object-cover border border-urbana-gold/50 flex-shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-urbana-gold flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-medium text-white truncate">{selectedBarber.nome}</span>
                </div>
              )}
              {selectedDate && selectedTime && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-urbana-gold/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-urbana-gold flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-white whitespace-nowrap">
                    {format(selectedDate, "dd/MM", { locale: ptBR })} às {selectedTime}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Voltar - Mobile Optimized */}
      <Button
        onClick={handleBack}
        variant="ghost"
        className="mb-3 sm:mb-4 text-white hover:text-urbana-gold hover:bg-white/10 h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base touch-manipulation"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
        Voltar
      </Button>

      {/* Main Content */}
      <div>
            {/* Step 1: Service Selection */}
            {step === 'service' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Escolha o Serviço</h2>
                  <p className="text-white/60">Selecione o serviço que deseja realizar</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {loading ? (
                    <div className="col-span-full text-center text-white py-12 px-2">
                      <div className="w-8 h-8 border-3 border-white/30 border-t-urbana-gold rounded-full animate-spin mx-auto mb-4" />
                      Carregando serviços...
                    </div>
                  ) : services.length === 0 ? (
                    <div className="col-span-full text-center text-white/60 py-12 px-2">
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
                        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-urbana-gold mt-3">
                          R$ {service.preco.toFixed(2)}
                        </p>
                        <p className="text-base sm:text-lg text-white/60 mt-2">
                          {service.duracao} minutos
                        </p>
                      </TotemCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Barber Selection */}
            {step === 'barber' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Escolha o Profissional</h2>
                  <p className="text-white/60">Selecione o profissional de sua preferência</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {loading ? (
                    <div className="col-span-full text-center text-white py-12 px-2">
                      <div className="w-8 h-8 border-3 border-white/30 border-t-urbana-gold rounded-full animate-spin mx-auto mb-4" />
                      Carregando profissionais...
                    </div>
                  ) : barbers.length === 0 ? (
                    <div className="col-span-full text-center text-white/60 py-12 px-2">
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
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mb-3 overflow-hidden border-3 border-urbana-gold/60 bg-gradient-to-br from-urbana-black-soft to-urbana-black shadow-lg">
                          {barber.image_url ? (
                            <img
                              src={barber.image_url}
                              alt={barber.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-12 h-12 sm:w-14 sm:h-14 text-urbana-gold/60" />
                            </div>
                          )}
                        </div>
                        <TotemCardTitle className="text-center">{barber.nome}</TotemCardTitle>
                      </TotemCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Date & Time Selection */}
            {step === 'datetime' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Escolha Data e Horário</h2>
                  <p className="text-white/60">Selecione a melhor data e horário para você</p>
                </div>

                {/* Date Selection */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-urbana-gold" />
                    Data
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {loading ? (
                      <div className="col-span-full text-center text-white py-8">
                        <div className="w-8 h-8 border-3 border-white/30 border-t-urbana-gold rounded-full animate-spin mx-auto mb-4" />
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
                    </div>
                  </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-urbana-gold" />
                      Horário
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {loading ? (
                        <div className="col-span-full text-center text-white py-8">
                          <div className="w-8 h-8 border-3 border-white/30 border-t-urbana-gold rounded-full animate-spin mx-auto mb-4" />
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
                      </div>
                    </div>
                  )}

                {/* Summary & Confirm */}
                {selectedDate && selectedTime && (
                  <div className="mt-8">
                    <Card className="bg-urbana-black/40 border-2 border-urbana-gold/50 shadow-2xl shadow-urbana-gold/20">
                      <CardHeader className="bg-urbana-gold/20 border-b border-urbana-gold/30">
                        <CardTitle className="text-white text-xl flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          Confirme seu Agendamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3 text-white bg-urbana-black/30 p-4 rounded-lg border border-urbana-gold/20">
                            <Scissors className="w-5 h-5 text-urbana-gold mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-white/60 mb-1">Serviço</p>
                              <p className="font-semibold">{selectedService?.nome}</p>
                              <p className="text-sm text-urbana-gold mt-1">R$ {selectedService?.preco.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 text-white bg-urbana-black/30 p-4 rounded-lg border border-urbana-gold/20">
                            {selectedBarber?.image_url ? (
                              <img 
                                src={selectedBarber.image_url} 
                                alt={selectedBarber.nome}
                                className="w-12 h-12 rounded-full object-cover border-2 border-urbana-gold/50 shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <User className="w-5 h-5 text-urbana-gold mt-0.5 shrink-0" />
                            )}
                            <div>
                              <p className="text-xs text-white/60 mb-1">Profissional</p>
                              <p className="font-semibold">{selectedBarber?.nome}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 text-white bg-urbana-black/30 p-4 rounded-lg border border-urbana-gold/20">
                            <CalendarIcon className="w-5 h-5 text-urbana-gold mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-white/60 mb-1">Data</p>
                              <p className="font-semibold capitalize">
                                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 text-white bg-urbana-black/30 p-4 rounded-lg border border-urbana-gold/20">
                            <Clock className="w-5 h-5 text-urbana-gold mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-white/60 mb-1">Horário</p>
                              <p className="font-semibold text-lg">{selectedTime}</p>
                              <p className="text-xs text-white/60 mt-1">{selectedService?.duracao} minutos</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleConfirm}
                          disabled={creating || isValidating}
                          className="w-full mt-4 bg-urbana-gold text-black hover:bg-urbana-gold/90 font-bold py-6 text-lg shadow-lg shadow-urbana-gold/30 transition-all duration-300"
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

      {/* Modal de confirmação de sucesso */}
      {showSuccessDialog && selectedService && selectedBarber && selectedDate && selectedTime && (
        <SuccessConfirmationDialog
          isOpen={showSuccessDialog}
          onClose={() => {
            setShowSuccessDialog(false);
            // Resetar formulário e voltar para o início
            setStep('service');
            setSelectedService(null);
            setSelectedBarber(null);
            setSelectedDate(null);
            setSelectedTime(null);
          }}
          appointmentDetails={{
            serviceName: selectedService.nome,
            barberName: selectedBarber.nome,
            date: selectedDate,
            time: selectedTime,
            price: selectedService.preco
          }}
        />
      )}
    </ClientPageContainer>
  );
};

export default PainelClienteNovoAgendamento;
