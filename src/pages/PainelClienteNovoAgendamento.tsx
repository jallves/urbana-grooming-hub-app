import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Scissors, User, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  email: string;
  staff_id: string;
}

type Step = 'service' | 'barber' | 'date' | 'time' | 'confirm';

export default function PainelClienteNovoAgendamento() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const { getAvailableTimeSlots, validateAppointment, isValidating } = useAppointmentValidation();
  
  // Estado geral
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [isLoading, setIsLoading] = useState(false);
  
  // Dados disponíveis
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<{ time: string; available: boolean }[]>([]);
  
  // Seleções
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Carregar serviços
  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from('painel_servicos')
        .select('*')
        .order('nome');
      
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  // Carregar barbeiros quando serviço é selecionado
  useEffect(() => {
    if (selectedService) {
      const fetchBarbers = async () => {
        const { data } = await supabase
          .from('painel_barbeiros')
          .select('id, nome, email, staff_id')
          .order('nome');
        
        if (data) setBarbers(data);
      };
      fetchBarbers();
    }
  }, [selectedService]);

  // Carregar datas disponíveis quando barbeiro é selecionado
  useEffect(() => {
    if (selectedBarber && selectedService) {
      loadAvailableDates();
    }
  }, [selectedBarber, selectedService]);

  // Carregar horários quando data é selecionada
  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      loadAvailableTimes();
    }
  }, [selectedDate, selectedBarber, selectedService]);

  const loadAvailableDates = async () => {
    if (!selectedBarber || !selectedService) return;

    setIsLoading(true);
    const dates: Date[] = [];
    
    try {
      // Verificar próximos 14 dias para garantir pelo menos 7 com horários
      for (let i = 0; i < 14 && dates.length < 7; i++) {
        const date = addDays(startOfToday(), i);
        
        // Verificar se há horários disponíveis nesta data
        const slots = await getAvailableTimeSlots(
          selectedBarber.staff_id,
          date,
          selectedService.duracao
        );
        
        if (slots.some(slot => slot.available)) {
          dates.push(date);
        }
      }
      
      setAvailableDates(dates);
      
      // Auto-selecionar primeira data se houver
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar datas:', error);
      toast.error('Erro ao carregar datas disponíveis');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableTimes = async () => {
    if (!selectedDate || !selectedBarber || !selectedService) return;

    setIsLoading(true);
    try {
      const slots = await getAvailableTimeSlots(
        selectedBarber.staff_id,
        selectedDate,
        selectedService.duracao
      );
      
      setAvailableTimes(slots);
      
      if (!slots.some(s => s.available)) {
        toast.info('Não há horários disponíveis para esta data');
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep('barber');
    
    // Reset próximas etapas
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setCurrentStep('date');
    
    // Reset próximas etapas
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentStep('time');
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep('confirm');
  };

  const handleBack = () => {
    const steps: Step[] = ['service', 'barber', 'date', 'time', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!cliente || !selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      // Validação final
      const validation = await validateAppointment(
        selectedBarber.staff_id,
        selectedDate,
        selectedTime,
        selectedService.duracao
      );

      if (!validation.valid) {
        setIsLoading(false);
        return;
      }

      // Criar agendamento
      const { error } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: cliente.id,
          barbeiro_id: selectedBarber.id,
          servico_id: selectedService.id,
          data: format(selectedDate, 'yyyy-MM-dd'),
          hora: selectedTime,
          status: 'confirmado',
          observacoes: notes.trim() || null
        });

      if (error) throw error;

      toast.success('Agendamento realizado com sucesso!');
      navigate('/painel-cliente/agendamentos');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  if (!cliente) {
    return <div>Acesso negado</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-urbana-brown/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/painel-cliente/agendamentos')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Novo Agendamento</h1>
              <p className="text-muted-foreground">Selecione os detalhes do seu atendimento</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            {[
              { key: 'service', label: 'Serviço', icon: Scissors },
              { key: 'barber', label: 'Barbeiro', icon: User },
              { key: 'date', label: 'Data', icon: Calendar },
              { key: 'time', label: 'Horário', icon: Clock },
              { key: 'confirm', label: 'Confirmar', icon: Check }
            ].map((step, index) => {
              const isActive = currentStep === step.key;
              const isCompleted = ['service', 'barber', 'date', 'time', 'confirm'].indexOf(currentStep) > index;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    isActive && "bg-primary/10 border-2 border-primary",
                    isCompleted && "bg-green-500/10 border-2 border-green-500"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive && "text-primary",
                      isCompleted && "text-green-500",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium hidden md:inline",
                      isActive && "text-primary",
                      isCompleted && "text-green-500",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {index < 4 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground mx-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Step: Serviço */}
          {currentStep === 'service' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-urbana-gold flex items-center gap-2">
                <Scissors className="w-6 h-6" />
                Escolha o Serviço
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                      "bg-card/50 backdrop-blur-sm border-2",
                      selectedService?.id === service.id 
                        ? "border-urbana-gold shadow-lg shadow-urbana-gold/20" 
                        : "border-border hover:border-urbana-gold/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-full bg-urbana-gold/10">
                        <Scissors className="w-5 h-5 text-urbana-gold" />
                      </div>
                      {selectedService?.id === service.id && (
                        <div className="p-1 rounded-full bg-urbana-gold">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{service.nome}</h3>
                    {service.descricao && (
                      <p className="text-sm text-muted-foreground mb-3">{service.descricao}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-urbana-gold">
                        R$ {service.preco.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {service.duracao} min
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step: Barbeiro */}
          {currentStep === 'barber' && selectedService && (
            <div className="space-y-4">
              <Button variant="ghost" onClick={handleBack} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <h2 className="text-2xl font-bold text-urbana-gold flex items-center gap-2">
                <User className="w-6 h-6" />
                Escolha o Profissional
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {barbers.map((barber) => (
                  <Card
                    key={barber.id}
                    onClick={() => handleBarberSelect(barber)}
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                      "bg-card/50 backdrop-blur-sm border-2",
                      selectedBarber?.id === barber.id 
                        ? "border-urbana-gold shadow-lg shadow-urbana-gold/20" 
                        : "border-border hover:border-urbana-gold/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-full bg-urbana-gold/10">
                        <User className="w-5 h-5 text-urbana-gold" />
                      </div>
                      {selectedBarber?.id === barber.id && (
                        <div className="p-1 rounded-full bg-urbana-gold">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{barber.nome}</h3>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step: Data */}
          {currentStep === 'date' && selectedBarber && (
            <div className="space-y-4">
              <Button variant="ghost" onClick={handleBack} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <h2 className="text-2xl font-bold text-urbana-gold flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Escolha a Data
              </h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
                </div>
              ) : availableDates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Não há datas disponíveis</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {availableDates.map((date) => (
                    <Card
                      key={date.toISOString()}
                      onClick={() => handleDateSelect(date)}
                      className={cn(
                        "p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                        "bg-card/50 backdrop-blur-sm border-2",
                        selectedDate && 
                        selectedDate.getDate() === date.getDate() &&
                        selectedDate.getMonth() === date.getMonth() &&
                        selectedDate.getFullYear() === date.getFullYear()
                          ? "border-urbana-gold shadow-lg shadow-urbana-gold/20" 
                          : "border-border hover:border-urbana-gold/50"
                      )}
                    >
                      <div className="text-center">
                        <Calendar className="w-6 h-6 text-urbana-gold mx-auto mb-2" />
                        <p className="text-lg font-bold text-foreground">
                          {format(date, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(date, 'EEEE', { locale: ptBR })}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Horário */}
          {currentStep === 'time' && selectedDate && (
            <div className="space-y-4">
              <Button variant="ghost" onClick={handleBack} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <h2 className="text-2xl font-bold text-urbana-gold flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Escolha o Horário
              </h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-urbana-gold/30 border-t-urbana-gold rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {availableTimes
                    .filter(slot => slot.available)
                    .map((slot) => (
                      <Card
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={cn(
                          "p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
                          "bg-card/50 backdrop-blur-sm border-2",
                          selectedTime === slot.time 
                            ? "border-urbana-gold shadow-lg shadow-urbana-gold/20" 
                            : "border-border hover:border-urbana-gold/50"
                        )}
                      >
                        <div className="text-center">
                          <Clock className="w-5 h-5 text-urbana-gold mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground">{slot.time}</p>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Confirmar */}
          {currentStep === 'confirm' && selectedTime && (
            <div className="space-y-6">
              <Button variant="ghost" onClick={handleBack} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
              <h2 className="text-2xl font-bold text-urbana-gold flex items-center gap-2">
                <Check className="w-6 h-6" />
                Confirmar Agendamento
              </h2>

              {/* Resumo */}
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">Resumo do Agendamento</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-urbana-gold" />
                    <div>
                      <p className="text-sm text-muted-foreground">Serviço</p>
                      <p className="font-semibold text-foreground">{selectedService?.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-urbana-gold" />
                    <div>
                      <p className="text-sm text-muted-foreground">Profissional</p>
                      <p className="font-semibold text-foreground">{selectedBarber?.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-urbana-gold" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-semibold text-foreground">
                        {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-urbana-gold" />
                    <div>
                      <p className="text-sm text-muted-foreground">Horário</p>
                      <p className="font-semibold text-foreground">{selectedTime}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma observação especial para o profissional..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Botão Confirmar */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || isValidating}
                size="lg"
                className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-white font-bold"
              >
                {isLoading || isValidating ? 'Confirmando...' : 'Confirmar Agendamento'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
