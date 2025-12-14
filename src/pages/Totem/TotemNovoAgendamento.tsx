import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Scissors, Check, Sparkles, Award, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAvailabilityCheck } from '@/hooks/totem/useAvailabilityCheck';
import { useRetryOperation } from '@/components/totem/RetryOperation';
import { TimeoutWarning } from '@/components/totem/TimeoutWarning';
import { useTotemTimeout } from '@/hooks/totem/useTotemTimeout';
import { sendConfirmationEmailDirect } from '@/hooks/useSendAppointmentEmail';
import barbershopBg from '@/assets/barbershop-background.jpg';

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  descricao?: string;
}

interface Barber {
  id: string;
  nome: string;
  specialties?: string;
  image_url?: string;
  experience?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const TotemNovoAgendamento: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const clientData = location.state?.client;

  const [step, setStep] = useState<'service' | 'barber' | 'datetime'>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [hoveredBarber, setHoveredBarber] = useState<Barber | null>(null);

  // Hooks robustos
  const { getAvailableTimeSlots, checkAvailability, isChecking } = useAvailabilityCheck();
  const { execute: executeWithRetry, isExecuting } = useRetryOperation(3, 2000);
  
  // Sistema de timeout
  const { showWarning, formatTimeLeft, extendTime } = useTotemTimeout({
    timeout: 5 * 60 * 1000,
    warningTime: 30 * 1000,
    enabled: true,
    onTimeout: () => {
      toast.info('Sessão encerrada por inatividade');
      navigate('/totem/home');
    },
  });

  useEffect(() => {
    if (!clientData) {
      toast.error('Cliente não encontrado');
      navigate('/totem/search');
      return;
    }
    fetchServices();
  }, [clientData]);

  useEffect(() => {
    if (step === 'barber' && selectedService) {
      fetchBarbers();
    }
  }, [step, selectedService]);

  useEffect(() => {
    if (step === 'datetime' && selectedBarber && selectedDate && selectedService) {
      fetchAvailableTimeSlotsRobust();
    }
  }, [step, selectedBarber, selectedDate, selectedService]);

  const fetchServices = async () => {
    const result = await executeWithRetry(
      async () => {
        // Buscar apenas serviços com preço > 0 e que tenham barbeiros vinculados
        const { data: servicesWithStaff, error: staffError } = await supabase
          .from('service_staff')
          .select('service_id');

        if (staffError) throw staffError;

        const serviceIdsWithStaff = [...new Set(servicesWithStaff?.map(s => s.service_id) || [])];

        if (serviceIdsWithStaff.length === 0) {
          return [];
        }

        const { data, error } = await supabase
          .from('painel_servicos')
          .select('*')
          .eq('is_active', true)
          .gt('preco', 0)
          .in('id', serviceIdsWithStaff)
          .order('nome');

        if (error) throw error;
        return data || [];
      },
      'carregar serviços'
    );

    if (result) {
      setServices(result);
    }
  };

  const fetchBarbers = async () => {
    if (!selectedService) return;
    
    setIsLoading(true);

    const result = await executeWithRetry(
      async () => {
        // 1. Buscar barbeiros vinculados ao serviço
        const { data: serviceStaff, error: serviceStaffError } = await supabase
          .from('service_staff')
          .select('staff_id')
          .eq('service_id', selectedService.id);

        if (serviceStaffError) throw serviceStaffError;

        if (!serviceStaff || serviceStaff.length === 0) {
          return [];
        }

        const linkedStaffIds = serviceStaff.map(s => s.staff_id);

        // 2. Buscar IDs dos barbeiros disponíveis (available_for_booking = true)
        const { data: availableBarbers, error: barbersError } = await supabase
          .from('painel_barbeiros')
          .select('staff_id')
          .eq('is_active', true)
          .eq('available_for_booking', true)
          .in('staff_id', linkedStaffIds);

        if (barbersError) throw barbersError;

        if (!availableBarbers || availableBarbers.length === 0) {
          return [];
        }

        const availableStaffIds = availableBarbers.map(b => b.staff_id);

        // 3. Buscar dados dos barbeiros da tabela staff
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id, name, email, specialties, image_url, experience')
          .in('id', availableStaffIds)
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('name');

        if (staffError) throw staffError;

        // Transformar para o formato esperado pelo componente
        return (staffData || []).map(s => ({
          id: s.id,
          nome: s.name,
          specialties: s.specialties,
          image_url: s.image_url,
          experience: s.experience
        }));
      },
      'carregar barbeiros'
    );

    if (result) {
      setBarbers(result);
      
      if (result.length === 0) {
        toast.info('Nenhum barbeiro disponível', {
          description: 'Este serviço ainda não tem barbeiros vinculados.'
        });
      }
    }
    
    setIsLoading(false);
  };

  const fetchAvailableTimeSlotsRobust = async () => {
    if (!selectedDate || !selectedBarber || !selectedService) return;

    setIsLoading(true);

    try {
      const slots = await getAvailableTimeSlots(
        selectedBarber.id,
        selectedDate,
        selectedService.duracao
      );

      setTimeSlots(slots);
      
      if (slots.filter(s => s.available).length === 0) {
        toast.warning('Sem horários disponíveis', {
          description: 'Não há horários disponíveis nesta data. Tente outra data.',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      toast.error('Erro ao buscar horários disponíveis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('barber');
  };

  const handleBarberClick = (barber: Barber) => {
    setHoveredBarber(barber);
    setShowBarberModal(true);
  };

  const handleConfirmBarber = () => {
    if (hoveredBarber) {
      setSelectedBarber(hoveredBarber);
      setShowBarberModal(false);
      setStep('datetime');
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleConfirmAppointment = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos', {
        duration: 5000,
        style: {
          background: 'hsl(var(--urbana-brown))',
          color: 'hsl(var(--urbana-light))',
          border: '3px solid hsl(var(--destructive))',
          fontSize: '1.25rem',
          padding: '1.5rem',
        }
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verificação robusta antes de criar
      console.log('🔍 Verificando disponibilidade final...');
      const availabilityCheck = await checkAvailability(
        selectedBarber.id,
        selectedDate,
        selectedTime,
        selectedService.duracao
      );

      if (!availabilityCheck.valid) {
        toast.error('Horário não disponível', {
          description: availabilityCheck.error || 'Este horário não está mais disponível',
          duration: 6000,
        });
        // Recarregar slots
        await fetchAvailableTimeSlotsRobust();
        setIsLoading(false);
        return;
      }

      // Criar agendamento com retry
      // Garantir data local sem conversão de timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dataLocal = `${year}-${month}-${day}`;
      
      const result = await executeWithRetry(
        async () => {
          const { data, error } = await supabase
            .from('painel_agendamentos')
            .insert({
              cliente_id: clientData.id,
              barbeiro_id: selectedBarber.id,
              servico_id: selectedService.id,
              data: dataLocal,
              hora: selectedTime,
              status: 'agendado'
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        'criar agendamento'
      );

      if (!result) {
        setIsLoading(false);
        return;
      }

      console.log('✅ Agendamento criado com sucesso:', result.id);

      // Mostrar toast de sucesso imediatamente
      toast.success('✅ Agendamento criado com sucesso!', {
        description: `${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às ${selectedTime}`,
        duration: 5000,
        style: {
          background: 'hsl(var(--urbana-brown))',
          color: 'hsl(var(--urbana-light))',
          border: '3px solid hsl(var(--urbana-gold))',
          fontSize: '1.25rem',
          padding: '1.5rem',
        }
      });

      // Preparar dados para navegação ANTES de enviar e-mail
      const navigationState = {
        appointment: result,
        service: selectedService,
        barber: selectedBarber,
        client: clientData
      };

      // Enviar e-mail de confirmação usando dados já disponíveis
      // Usar Promise com timeout para garantir que não bloqueia indefinidamente
      console.log('📧 [Totem] Iniciando envio de e-mail de confirmação...');
      console.log('📧 [Totem] Cliente:', clientData.nome, '- Email:', clientData.email);
      try {
        // Timeout de 10 segundos para o envio do e-mail
        const emailPromise = sendConfirmationEmailDirect({
          clientName: clientData.nome,
          clientEmail: clientData.email || '',
          serviceName: selectedService.nome,
          staffName: selectedBarber.nome,
          appointmentDate: dataLocal,
          appointmentTime: selectedTime,
          servicePrice: selectedService.preco,
          serviceDuration: selectedService.duracao
        });
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log('⏰ [Totem] Timeout no envio do e-mail, continuando navegação...');
            resolve(false);
          }, 10000);
        });

        const emailSent = await Promise.race([emailPromise, timeoutPromise]);
        if (emailSent) {
          console.log('✅ [Totem] E-mail de confirmação enviado com sucesso!');
        } else {
          console.log('📧 [Totem] E-mail não enviado (cliente sem e-mail válido, timeout ou erro)');
        }
      } catch (emailError) {
        console.error('❌ [Totem] Erro ao enviar e-mail de confirmação:', emailError);
      }

      // Navegar APENAS após tentativa de envio do e-mail
      console.log('🚀 Navegando para tela de sucesso...');
      navigate('/totem/agendamento-sucesso', {
        state: navigationState
      });
    } catch (error: any) {
      console.error('❌ Erro fatal ao criar agendamento:', error);
      setIsLoading(false);
    }
  };

  const renderServiceSelection = () => (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 landscape:space-y-2">
      <div className="text-center space-y-1 sm:space-y-2 landscape:space-y-1">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light flex items-center justify-center gap-2 sm:gap-3 landscape:text-lg landscape:sm:text-xl">
          <Scissors className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-urbana-gold landscape:w-5 landscape:h-5" />
          Escolha o Serviço
        </h2>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-urbana-light/70 landscape:text-xs">
          Selecione o serviço desejado
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 landscape:grid-cols-3 landscape:gap-2">
        {services.map((service, index) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className="group relative bg-gradient-to-br from-urbana-black-soft/90 to-urbana-black/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] active:scale-95 border-2 border-urbana-gold/30 hover:border-urbana-gold/60 overflow-hidden animate-fade-in landscape:p-3"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 via-urbana-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative space-y-3 landscape:space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-urbana-gold/20 to-urbana-gold/10 flex items-center justify-center border border-urbana-gold/30 landscape:w-10 landscape:h-10">
                  <Scissors className="w-6 h-6 md:w-7 md:h-7 text-urbana-gold landscape:w-5 landscape:h-5" />
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-urbana-gold/10 flex items-center justify-center border border-urbana-gold/20 landscape:w-8 landscape:h-8">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-urbana-gold/80 landscape:w-4 landscape:h-4" />
                </div>
              </div>
              
              <div className="text-left space-y-1">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-urbana-light group-hover:text-urbana-gold transition-colors landscape:text-base">
                  {service.nome}
                </h3>
                {service.descricao && (
                  <p className="text-xs md:text-sm text-urbana-light/60 line-clamp-2 landscape:text-[10px]">
                    {service.descricao}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-urbana-gold/20 landscape:pt-1">
                  <span className="text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant landscape:text-lg">
                    R$ {service.preco.toFixed(2)}
                  </span>
                  <span className="text-xs md:text-sm text-urbana-light/70 font-medium landscape:text-[10px]">
                    {service.duracao} min
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderBarberSelection = () => (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 landscape:space-y-2">
      <div className="text-center space-y-1 sm:space-y-2 landscape:space-y-1">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light flex items-center justify-center gap-2 sm:gap-3 landscape:text-lg landscape:sm:text-xl">
          <User className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-urbana-gold landscape:w-5 landscape:h-5" />
          Escolha o Barbeiro
        </h2>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-urbana-light/70 landscape:text-xs">
          Selecione seu barbeiro preferido
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 landscape:grid-cols-3 landscape:gap-2">
        {barbers.map((barber, index) => (
          <button
            key={barber.id}
            onClick={() => handleBarberClick(barber)}
            className="group relative bg-gradient-to-br from-urbana-black-soft/90 to-urbana-black/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] active:scale-95 border-2 border-urbana-gold/30 hover:border-urbana-gold/60 overflow-hidden animate-fade-in landscape:p-3"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/5 via-urbana-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex flex-col items-center space-y-3 landscape:space-y-2">
              <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-urbana-gold-dark overflow-hidden border-4 border-urbana-gold/40 group-hover:border-urbana-gold transition-all shadow-lg shadow-urbana-gold/20 landscape:w-20 landscape:h-20 landscape:md:w-24 landscape:md:h-24">
                {barber.image_url ? (
                  <img src={barber.image_url} alt={barber.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-urbana-black-soft to-urbana-black">
                    <User className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-urbana-gold/60 landscape:w-10 landscape:h-10" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-urbana-light group-hover:text-urbana-gold transition-colors landscape:text-base">
                  {barber.nome}
                </h3>
                {barber.specialties && (
                  <p className="text-xs md:text-sm text-urbana-light/70 line-clamp-2 landscape:text-[10px]">
                    {barber.specialties}
                  </p>
                )}
                {barber.experience && (
                  <div className="flex items-center justify-center gap-1 text-urbana-gold/80">
                    <Award className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="text-[10px] md:text-xs font-medium">{barber.experience}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDateTimeSelection = () => (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 landscape:space-y-2">
      <div className="text-center space-y-1 sm:space-y-2 landscape:space-y-1">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-urbana-light flex items-center justify-center gap-2 sm:gap-3 landscape:text-lg landscape:sm:text-xl">
          <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-urbana-gold landscape:w-5 landscape:h-5" />
          Data e Horário
        </h2>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-urbana-light/70 landscape:text-xs">
          Escolha o melhor dia e horário para você
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 landscape:gap-3 landscape:grid-cols-2">
        {/* Calendário */}
        <Card className="bg-gradient-to-br from-urbana-black-soft/90 to-urbana-black/80 border-2 border-urbana-gold/30 p-4 md:p-6 landscape:p-3 shadow-xl">
          <h3 className="text-lg md:text-xl font-bold text-urbana-gold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 md:w-6 md:h-6" />
            Selecione a Data
          </h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              const dataComparacao = new Date(date);
              dataComparacao.setHours(0, 0, 0, 0);
              return dataComparacao < hoje || date > addDays(new Date(), 60);
            }}
            locale={ptBR}
            className="rounded-lg [&_button]:text-sm [&_button]:md:text-base [&_.rdp-day_selected]:bg-urbana-gold [&_.rdp-day_selected]:text-urbana-black [&_.rdp-day]:text-urbana-light [&_.rdp-day:hover]:bg-urbana-gold/20"
          />
        </Card>

        {/* Horários */}
        <Card className="bg-gradient-to-br from-urbana-black-soft/90 to-urbana-black/80 border-2 border-urbana-gold/30 p-4 md:p-6 landscape:p-3 shadow-xl">
          <h3 className="text-lg md:text-xl font-bold text-urbana-gold mb-4 flex items-center gap-2 landscape:text-base landscape:mb-3">
            <Clock className="w-5 h-5 md:w-6 md:h-6" />
            Horários Disponíveis
          </h3>
          
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-64 text-urbana-light/60 landscape:h-48">
              <CalendarIcon className="w-16 h-16 mb-4 text-urbana-gold/30" />
              <p className="text-center text-sm md:text-base landscape:text-xs">Selecione uma data primeiro</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64 landscape:h-48">
              <div className="w-12 h-12 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-72 md:max-h-80 overflow-y-auto landscape:max-h-56 landscape:gap-1.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-urbana-black/50 [&::-webkit-scrollbar-thumb]:bg-urbana-gold/50 [&::-webkit-scrollbar-thumb]:rounded-full">
              {timeSlots.map((slot, index) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`
                    p-2 md:p-3 rounded-lg font-bold text-sm md:text-base transition-all duration-200 landscape:p-1.5 landscape:text-xs
                    ${selectedTime === slot.time
                      ? 'bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black scale-105 shadow-lg shadow-urbana-gold/50 border-2 border-urbana-gold'
                      : slot.available
                        ? 'bg-urbana-black-soft/70 border-2 border-urbana-gold/30 text-urbana-light hover:bg-urbana-gold/20 hover:border-urbana-gold/60 hover:scale-105'
                        : 'bg-urbana-black-soft/30 border border-urbana-gray/10 text-urbana-light/30 cursor-not-allowed'
                    }
                  `}
                  style={{ animationDelay: `${index * 0.02}s` }}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Resumo e Confirmação */}
      {selectedDate && selectedTime && (
        <Card className="mt-6 bg-gradient-to-br from-urbana-black-soft/95 via-urbana-black/90 to-urbana-black-soft/95 border-2 border-urbana-gold/50 p-6 md:p-8 animate-fade-in shadow-2xl shadow-urbana-gold/20 landscape:p-4 landscape:mt-4">
          <div className="space-y-6 landscape:space-y-4">
            <div className="flex items-center justify-center gap-3 text-urbana-gold">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
              <h3 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light landscape:text-lg">
                Resumo do Agendamento
              </h3>
              <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 landscape:gap-3">
              <div className="space-y-1 p-4 bg-urbana-black-soft/50 rounded-xl border border-urbana-gold/20 landscape:p-2">
                <div className="flex items-center gap-2 text-urbana-gold/70 mb-2">
                  <Scissors className="w-4 h-4" />
                  <p className="text-xs md:text-sm font-medium">Serviço</p>
                </div>
                <p className="text-urbana-light font-bold text-base md:text-lg landscape:text-sm">{selectedService?.nome}</p>
                <p className="text-urbana-gold text-sm md:text-base font-semibold landscape:text-xs">
                  R$ {selectedService?.preco.toFixed(2)}
                </p>
              </div>
              
              <div className="space-y-1 p-4 bg-urbana-black-soft/50 rounded-xl border border-urbana-gold/20 landscape:p-2">
                <div className="flex items-center gap-2 text-urbana-gold/70 mb-2">
                  <User className="w-4 h-4" />
                  <p className="text-xs md:text-sm font-medium">Barbeiro</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedBarber?.image_url ? (
                    <img 
                      src={selectedBarber.image_url} 
                      alt={selectedBarber.nome}
                      className="w-10 h-10 rounded-full object-cover border-2 border-urbana-gold/50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-urbana-gold/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-urbana-gold/60" />
                    </div>
                  )}
                  <p className="text-urbana-light font-bold text-base md:text-lg landscape:text-sm">{selectedBarber?.nome}</p>
                </div>
              </div>
              
              <div className="space-y-1 p-4 bg-urbana-black-soft/50 rounded-xl border border-urbana-gold/20 landscape:p-2">
                <div className="flex items-center gap-2 text-urbana-gold/70 mb-2">
                  <CalendarIcon className="w-4 h-4" />
                  <p className="text-xs md:text-sm font-medium">Data</p>
                </div>
                <p className="text-urbana-light font-bold text-base md:text-lg landscape:text-sm">
                  {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              
              <div className="space-y-1 p-4 bg-urbana-black-soft/50 rounded-xl border border-urbana-gold/20 landscape:p-2">
                <div className="flex items-center gap-2 text-urbana-gold/70 mb-2">
                  <Clock className="w-4 h-4" />
                  <p className="text-xs md:text-sm font-medium">Horário</p>
                </div>
                <p className="text-urbana-light font-bold text-base md:text-lg landscape:text-sm">{selectedTime}</p>
              </div>
            </div>

            <Button
              onClick={handleConfirmAppointment}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold hover:from-urbana-gold-vibrant hover:via-urbana-gold hover:to-urbana-gold-vibrant text-urbana-black font-black text-lg md:text-xl h-14 md:h-16 landscape:h-12 landscape:text-base shadow-lg shadow-urbana-gold/30 transition-all duration-300"
            >
              {isLoading ? (
                <div className="w-7 h-7 border-4 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-6 h-6 md:w-7 md:h-7 mr-2" />
                  Confirmar Agendamento
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden landscape:py-2 landscape:px-4 relative">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={barbershopBg} 
          alt="Barbearia" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-urbana-black/60" />
      </div>

      {/* Modal Premium de Confirmação do Barbeiro */}
      <Dialog open={showBarberModal} onOpenChange={setShowBarberModal}>
        <DialogContent className="bg-gradient-to-br from-urbana-black via-urbana-black-soft to-urbana-black border-2 border-urbana-gold/50 max-w-2xl p-0 overflow-hidden">
          <div className="relative">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-urbana-gold/20 via-urbana-gold/30 to-urbana-gold/20 p-6 border-b-2 border-urbana-gold/30">
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-bold text-urbana-light text-center flex items-center justify-center gap-3">
                  <Sparkles className="w-8 h-8 text-urbana-gold" />
                  Confirme sua Escolha
                  <Sparkles className="w-8 h-8 text-urbana-gold" />
                </DialogTitle>
              </DialogHeader>
            </div>

            {hoveredBarber && (
              <div className="p-8 space-y-6">
                {/* Foto grande do barbeiro */}
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Glow effect */}
                    <div className="absolute -inset-6 bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-transparent blur-2xl opacity-40" />
                    
                    <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-urbana-gold-dark overflow-hidden border-4 border-urbana-gold shadow-2xl shadow-urbana-gold/50">
                      {hoveredBarber.image_url ? (
                        <img 
                          src={hoveredBarber.image_url} 
                          alt={hoveredBarber.nome} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-urbana-black-soft to-urbana-black">
                          <User className="w-32 h-32 text-urbana-gold/60" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações do barbeiro */}
                <div className="space-y-4 text-center">
                  <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light">
                    {hoveredBarber.nome}
                  </h3>

                  {hoveredBarber.specialties && (
                    <div className="flex items-center justify-center gap-2 text-urbana-light/80">
                      <Scissors className="w-5 h-5 text-urbana-gold" />
                      <p className="text-lg md:text-xl">
                        {hoveredBarber.specialties}
                      </p>
                    </div>
                  )}

                  {hoveredBarber.experience && (
                    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-urbana-gold/20 border border-urbana-gold/40 rounded-full backdrop-blur-sm">
                      <Award className="w-6 h-6 text-urbana-gold" />
                      <span className="text-lg font-semibold text-urbana-light">
                        {hoveredBarber.experience}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button
                    onClick={() => setShowBarberModal(false)}
                    variant="outline"
                    className="h-14 text-lg font-semibold border-2 border-urbana-gray/50 hover:border-urbana-gold/50 bg-urbana-black-soft/50 hover:bg-urbana-black-soft text-urbana-light"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleConfirmBarber}
                    className="h-14 text-lg font-bold bg-gradient-to-r from-urbana-gold via-urbana-gold-vibrant to-urbana-gold hover:from-urbana-gold-vibrant hover:via-urbana-gold hover:to-urbana-gold-vibrant text-urbana-black shadow-lg shadow-urbana-gold/30"
                  >
                    <Check className="w-6 h-6 mr-2" />
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 landscape:mb-2">
        <Button
          onClick={() => {
            if (step === 'service') {
              navigate('/totem/home');
            } else if (step === 'barber') {
              setStep('service');
            } else {
              setStep('barber');
            }
          }}
          variant="ghost"
          className="gap-2 text-urbana-light hover:text-urbana-gold h-10 sm:h-12 px-3 sm:px-4 landscape:h-8 landscape:px-2"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 landscape:w-4 landscape:h-4" />
          <span className="text-xs sm:text-sm md:text-base landscape:text-xs">Voltar</span>
        </Button>

        <div className="text-right">
          <p className="text-[10px] sm:text-xs md:text-sm text-urbana-light/60 landscape:text-[9px]">Cliente:</p>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-urbana-gold landscape:text-xs">
            {clientData?.nome}
          </p>
        </div>
      </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-6 md:mb-8 landscape:mb-3">
          {['service', 'barber', 'datetime'].map((stepName, index) => {
            const stepLabels = ['Serviço', 'Barbeiro', 'Data/Hora'];
            const isActive = step === stepName;
            const isCompleted = index < ['service', 'barber', 'datetime'].indexOf(step);
            
            return (
              <div key={stepName} className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                      relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-base md:text-lg transition-all duration-300 landscape:w-10 landscape:h-10 landscape:text-sm
                      ${isActive || isCompleted
                        ? 'bg-gradient-to-br from-urbana-gold via-urbana-gold-vibrant to-urbana-gold text-urbana-black shadow-lg shadow-urbana-gold/50 scale-110'
                        : 'bg-urbana-black-soft/70 border-2 border-urbana-gold/20 text-urbana-light/40'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 md:w-7 md:h-7 landscape:w-5 landscape:h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-urbana-gold/30 animate-ping" />
                    )}
                  </div>
                  <span className={`text-xs md:text-sm font-semibold transition-colors landscape:text-[10px] ${isActive || isCompleted ? 'text-urbana-gold' : 'text-urbana-light/50'}`}>
                    {stepLabels[index]}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`w-12 md:w-20 h-1 rounded-full transition-all duration-300 landscape:w-8 ${isCompleted ? 'bg-gradient-to-r from-urbana-gold to-urbana-gold-vibrant' : 'bg-urbana-gold/20'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {step === 'service' && renderServiceSelection()}
            {step === 'barber' && renderBarberSelection()}
            {step === 'datetime' && renderDateTimeSelection()}
          </div>
        </div>

        {/* Timeout Warning */}
        <TimeoutWarning
          open={showWarning}
          timeLeft={formatTimeLeft}
          onExtend={extendTime}
        />
      </div>
    </div>
  );
};

export default TotemNovoAgendamento;
