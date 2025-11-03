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

    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          available: !occupiedTimes.has(timeString)
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
      toast.error('Preencha todos os campos');
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
          status: 'agendado'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Agendamento criado com sucesso!', {
        description: `${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às ${selectedTime}`
      });

      navigate('/totem/agendamento-sucesso', {
        state: {
          appointment: data,
          service: selectedService,
          barber: selectedBarber,
          client: clientData
        }
      });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento', {
        description: 'Tente novamente ou procure a recepção.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderServiceSelection = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light flex items-center justify-center gap-3">
          <Scissors className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold" />
          Escolha o Serviço
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-urbana-light/70">
          Selecione o serviço desejado
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {services.map((service, index) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className="group relative bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black-soft/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 transition-all duration-200 active:scale-95 border-2 border-urbana-gray/20 active:border-urbana-gold/50 overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
            
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-urbana-gold group-active:text-urbana-gold-vibrant transition-colors" />
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-urbana-gold/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-urbana-gold" />
                </div>
              </div>
              
              <div className="text-left space-y-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light group-active:text-urbana-gold transition-colors">
                  {service.nome}
                </h3>
                {service.descricao && (
                  <p className="text-xs sm:text-sm text-urbana-light/60 line-clamp-2">
                    {service.descricao}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-urbana-gold">
                    R$ {service.preco.toFixed(2)}
                  </span>
                  <span className="text-xs sm:text-sm text-urbana-light/60">
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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light flex items-center justify-center gap-3">
          <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold" />
          Escolha o Barbeiro
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-urbana-light/70">
          Selecione seu barbeiro preferido
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {barbers.map((barber, index) => (
          <button
            key={barber.id}
            onClick={() => handleBarberSelect(barber)}
            className="group relative bg-gradient-to-br from-urbana-black-soft/80 to-urbana-black-soft/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-200 active:scale-95 border-2 border-urbana-gray/20 active:border-urbana-gold/50 overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-urbana-gold/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
            
            <div className="relative flex flex-col items-center space-y-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-urbana-gold to-urbana-gold-dark overflow-hidden border-4 border-urbana-gold/30 group-active:border-urbana-gold transition-all">
                {barber.foto_url ? (
                  <img src={barber.foto_url} alt={barber.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-urbana-black-soft">
                    <User className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-urbana-light/40" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-urbana-light group-active:text-urbana-gold transition-colors">
                  {barber.nome}
                </h3>
                {barber.especialidades && (
                  <p className="text-xs sm:text-sm text-urbana-light/60">
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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-urbana-light flex items-center justify-center gap-3">
          <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-urbana-gold" />
          Data e Horário
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-urbana-light/70">
          Escolha o melhor dia e horário para você
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Calendário */}
        <Card className="bg-urbana-black-soft/80 border-urbana-gray/20 p-4 sm:p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
            locale={ptBR}
            className="rounded-lg"
          />
        </Card>

        {/* Horários */}
        <Card className="bg-urbana-black-soft/80 border-urbana-gray/20 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-urbana-light mb-4">
            Horários Disponíveis
          </h3>
          
          {!selectedDate ? (
            <div className="flex items-center justify-center h-64 text-urbana-light/60">
              <p className="text-center">Selecione uma data primeiro</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
              {timeSlots.map((slot, index) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`
                    p-2 sm:p-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200
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
        <Card className="bg-gradient-to-br from-urbana-gold/20 to-urbana-gold-dark/10 border-2 border-urbana-gold/30 p-4 sm:p-6 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-urbana-light">
              <Sparkles className="w-5 h-5 text-urbana-gold" />
              <h3 className="text-lg sm:text-xl font-bold">Resumo do Agendamento</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
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
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
              className="w-full bg-urbana-gold hover:bg-urbana-gold-vibrant text-urbana-black font-bold text-base sm:text-lg h-12 sm:h-14"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-urbana-black/30 border-t-urbana-black rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
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
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-urbana-black via-urbana-brown/10 to-urbana-black flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
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
          className="gap-2 text-urbana-light hover:text-urbana-gold"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-sm sm:text-base">Voltar</span>
        </Button>

        <div className="text-right">
          <p className="text-xs sm:text-sm text-urbana-light/60">Cliente:</p>
          <p className="text-sm sm:text-base md:text-lg font-semibold text-urbana-gold">
            {clientData?.nome}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        {['service', 'barber', 'datetime'].map((stepName, index) => (
          <div key={stepName} className="flex items-center gap-2">
            <div
              className={`
                w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all
                ${step === stepName || (index < ['service', 'barber', 'datetime'].indexOf(step))
                  ? 'bg-urbana-gold text-urbana-black'
                  : 'bg-urbana-black-soft border-2 border-urbana-gray/30 text-urbana-light/50'
                }
              `}
            >
              {index + 1}
            </div>
            {index < 2 && (
              <div className={`w-8 sm:w-12 h-1 rounded-full ${index < ['service', 'barber', 'datetime'].indexOf(step) ? 'bg-urbana-gold' : 'bg-urbana-gray/30'}`} />
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
