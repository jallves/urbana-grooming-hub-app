import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Scissors, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  especialidades?: string;
  foto_url?: string;
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
      fetchAvailableTimeSlots();
    }
  }, [step, selectedBarber, selectedDate, selectedService]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('painel_servicos')
      .select('*')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar serviços');
      return;
    }

    setServices(data || []);
  };

  const fetchBarbers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('painel_barbeiros')
      .select('*')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar barbeiros');
      setIsLoading(false);
      return;
    }

    setBarbers(data || []);
    setIsLoading(false);
  };

  const fetchAvailableTimeSlots = async () => {
    if (!selectedDate || !selectedBarber || !selectedService) return;

    setIsLoading(true);

    // Buscar agendamentos existentes do barbeiro naquela data
    const { data: appointments, error } = await supabase
      .from('painel_agendamentos')
      .select('hora')
      .eq('barbeiro_id', selectedBarber.id)
      .eq('data', format(selectedDate, 'yyyy-MM-dd'))
      .neq('status', 'cancelado');

    if (error) {
      toast.error('Erro ao verificar disponibilidade');
      setIsLoading(false);
      return;
    }

    // Gerar slots de 30 em 30 minutos (8h às 20h)
    const slots: TimeSlot[] = [];
    const occupiedTimes = new Set(appointments?.map(a => a.hora) || []);
    
    // Verificar se é hoje para filtrar horários passados
    const hoje = new Date();
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd');
    const horaAtual = hoje.getHours();
    const minutoAtual = hoje.getMinutes();

    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Se for hoje, só mostrar horários futuros (com margem de 30 min)
        let isPast = false;
        if (isToday) {
          if (hour < horaAtual || (hour === horaAtual && minute <= minutoAtual)) {
            isPast = true;
          }
        }
        
        slots.push({
          time: timeString,
          available: !occupiedTimes.has(timeString) && !isPast
        });
      }
    }

    setTimeSlots(slots);
    setIsLoading(false);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('barber');
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep('datetime');
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
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: clientData.id,
          barbeiro_id: selectedBarber.id,
          servico_id: selectedService.id,
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedTime,
          status: 'confirmado'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        throw error;
      }

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

      navigate('/totem/agendamento-sucesso', {
        state: {
          appointment: data,
          service: selectedService,
          barber: selectedBarber,
          client: clientData
        }
      });
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      
      let errorMessage = 'Não foi possível criar o agendamento';
      let errorDescription = 'Tente novamente ou procure a recepção.';
      
      // Tratar erros específicos
      if (error?.code === '23505') {
        errorDescription = 'Este horário já está ocupado. Por favor, escolha outro horário.';
      } else if (error?.message) {
        errorDescription = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 8000,
        style: {
          background: 'hsl(var(--urbana-brown))',
          color: 'hsl(var(--urbana-light))',
          border: '3px solid hsl(var(--destructive))',
          fontSize: '1.25rem',
          padding: '1.5rem',
          maxWidth: '600px'
        }
      });
    } finally {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 landscape:grid-cols-3 landscape:gap-2">
        {services.map((service, index) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className="group relative bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black-soft/60 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 transition-all duration-200 active:scale-95 border-2 border-urbana-gray/20 active:border-urbana-gold/50 overflow-hidden animate-fade-in landscape:p-2 landscape:sm:p-3 landscape:rounded-lg"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
            
            <div className="relative space-y-2 sm:space-y-3 landscape:space-y-1">
              <div className="flex items-center justify-between">
                <Scissors className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-urbana-gold group-active:text-urbana-gold-vibrant transition-colors landscape:w-4 landscape:h-4" />
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-urbana-gold/20 flex items-center justify-center landscape:w-7 landscape:h-7">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-urbana-gold landscape:w-3 landscape:h-3" />
                </div>
              </div>
              
              <div className="text-left space-y-0.5 sm:space-y-1">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light group-active:text-urbana-gold transition-colors landscape:text-sm landscape:sm:text-base">
                  {service.nome}
                </h3>
                {service.descricao && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-urbana-light/60 line-clamp-2 landscape:text-[9px]">
                    {service.descricao}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1 sm:pt-2 landscape:pt-0.5">
                  <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-urbana-gold landscape:text-base landscape:sm:text-lg">
                    R$ {service.preco.toFixed(2)}
                  </span>
                  <span className="text-[10px] sm:text-xs md:text-sm text-urbana-light/60 landscape:text-[9px]">
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
            onClick={() => handleBarberSelect(barber)}
            className="group relative bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black-soft/60 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 transition-all duration-200 active:scale-95 border-2 border-urbana-gray/20 active:border-urbana-gold/50 overflow-hidden animate-fade-in landscape:p-2 landscape:sm:p-3 landscape:rounded-lg"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
            
            <div className="relative flex flex-col items-center space-y-2 sm:space-y-3 landscape:space-y-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark overflow-hidden border-3 sm:border-4 border-urbana-gold/30 group-active:border-urbana-gold transition-all landscape:w-14 landscape:h-14 landscape:sm:w-16 landscape:sm:h-16">
                {barber.foto_url ? (
                  <img src={barber.foto_url} alt={barber.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-urbana-black-soft">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-urbana-light/40 landscape:w-7 landscape:h-7" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-0.5 sm:space-y-1 landscape:space-y-0">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-urbana-light group-active:text-urbana-gold transition-colors landscape:text-sm landscape:sm:text-base">
                  {barber.nome}
                </h3>
                {barber.especialidades && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-urbana-light/60 landscape:text-[9px]">
                    {barber.especialidades}
                  </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 landscape:gap-2 landscape:grid-cols-2">
        {/* Calendário */}
        <Card className="bg-urbana-black-soft/80 border-urbana-gray/20 p-3 sm:p-4 md:p-6 landscape:p-2">
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
            className="rounded-lg [&_button]:text-xs [&_button]:sm:text-sm [&_button]:md:text-base landscape:[&_button]:text-xs"
          />
        </Card>

        {/* Horários */}
        <Card className="bg-urbana-black-soft/80 border-urbana-gray/20 p-3 sm:p-4 md:p-6 landscape:p-2">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-urbana-light mb-3 sm:mb-4 landscape:text-sm landscape:mb-2">
            Horários Disponíveis
          </h3>
          
          {!selectedDate ? (
            <div className="flex items-center justify-center h-48 sm:h-56 md:h-64 text-urbana-light/60 landscape:h-40">
              <p className="text-center text-xs sm:text-sm md:text-base landscape:text-xs">Selecione uma data primeiro</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-48 sm:h-56 md:h-64 landscape:h-40">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin landscape:w-5 landscape:h-5" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-1.5 sm:gap-2 max-h-72 sm:max-h-80 md:max-h-96 overflow-y-auto landscape:max-h-60 landscape:gap-1">
              {timeSlots.map((slot, index) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`
                    p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-all duration-200 landscape:p-1 landscape:text-xs
                    ${selectedTime === slot.time
                      ? 'bg-urbana-gold text-urbana-black scale-105'
                      : slot.available
                        ? 'bg-urbana-black-soft border-2 border-urbana-gray/30 text-urbana-light active:scale-95 active:border-urbana-gold'
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
        <Card className="bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 border-2 border-urbana-gold/30 p-3 sm:p-4 md:p-6 animate-fade-in landscape:p-2">
          <div className="space-y-3 sm:space-y-4 landscape:space-y-2">
            <div className="flex items-center gap-2 text-urbana-light">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-urbana-gold landscape:w-4 landscape:h-4" />
              <h3 className="text-base sm:text-lg md:text-xl font-bold landscape:text-sm">Resumo do Agendamento</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm md:text-base landscape:grid-cols-4 landscape:gap-2 landscape:text-xs">
              <div>
                <p className="text-urbana-light/60">Serviço:</p>
                <p className="text-urbana-light font-semibold">{selectedService?.nome}</p>
              </div>
              <div>
                <p className="text-urbana-light/60">Barbeiro:</p>
                <p className="text-urbana-light font-semibold">{selectedBarber?.nome}</p>
              </div>
              <div>
                <p className="text-urbana-light/60">Data:</p>
                <p className="text-urbana-light font-semibold">
                  {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-urbana-light/60">Horário:</p>
                <p className="text-urbana-light font-semibold">{selectedTime}</p>
              </div>
            </div>

            <Button
              onClick={handleConfirmAppointment}
              disabled={isLoading}
              className="w-full bg-urbana-gold hover:bg-urbana-gold-vibrant text-urbana-black font-bold text-sm sm:text-base md:text-lg h-10 sm:h-12 md:h-14 landscape:h-9 landscape:text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 sm:border-4 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin landscape:w-4 landscape:h-4" />
              ) : (
                <>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 landscape:w-4 landscape:h-4" />
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
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden landscape:py-2 landscape:px-4">
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
      <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 mb-4 sm:mb-6 md:mb-8 landscape:mb-2">
        {['service', 'barber', 'datetime'].map((stepName, index) => (
          <div key={stepName} className="flex items-center gap-1 sm:gap-2">
            <div
              className={`
                w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm md:text-base transition-all landscape:w-6 landscape:h-6 landscape:text-xs
                ${step === stepName || (index < ['service', 'barber', 'datetime'].indexOf(step))
                  ? 'bg-urbana-gold text-urbana-black'
                  : 'bg-urbana-black-soft border-2 border-urbana-gray/30 text-urbana-light/50'
                }
              `}
            >
              {index + 1}
            </div>
            {index < 2 && (
              <div className={`w-6 sm:w-8 md:w-12 h-0.5 sm:h-1 rounded-full landscape:w-4 ${index < ['service', 'barber', 'datetime'].indexOf(step) ? 'bg-urbana-gold' : 'bg-urbana-gray/30'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {step === 'service' && renderServiceSelection()}
          {step === 'barber' && renderBarberSelection()}
          {step === 'datetime' && renderDateTimeSelection()}
        </div>
      </div>
    </div>
  );
};

export default TotemNovoAgendamento;
