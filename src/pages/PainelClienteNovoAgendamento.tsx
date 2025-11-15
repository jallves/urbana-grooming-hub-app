import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Scissors, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
  
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<{ time: string; available: boolean }[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from('painel_servicos').select('*').eq('is_active', true).order('nome');
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      const fetchBarbers = async () => {
        const { data } = await supabase.from('painel_barbeiros').select('id, nome, email, staff_id').order('nome');
        if (data) setBarbers(data);
      };
      fetchBarbers();
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedBarber && selectedService) loadAvailableDates();
  }, [selectedBarber, selectedService]);

  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) loadAvailableTimes();
  }, [selectedDate, selectedBarber, selectedService]);

  const loadAvailableDates = async () => {
    if (!selectedBarber || !selectedService) return;
    setIsLoading(true);
    const dates: Date[] = [];
    try {
      for (let i = 0; i < 15 && dates.length < 10; i++) {
        const date = addDays(startOfToday(), i);
        const slots = await getAvailableTimeSlots(selectedBarber.staff_id, date, selectedService.duracao);
        if (slots.some(slot => slot.available)) dates.push(date);
      }
      setAvailableDates(dates);
      if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0]);
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
      const slots = await getAvailableTimeSlots(selectedBarber.staff_id, selectedDate, selectedService.duracao);
      setAvailableTimes(slots);
      if (!slots.some(s => s.available)) toast.info('Não há horários disponíveis para esta data');
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
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setCurrentStep('date');
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
    if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1]);
  };

  const handleSubmit = async () => {
    if (!cliente || !selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsLoading(true);
    try {
      const validation = await validateAppointment(selectedBarber.staff_id, selectedDate, selectedTime, selectedService.duracao);
      if (!validation.valid) {
        setIsLoading(false);
        return;
      }
      const { error } = await supabase.from('painel_agendamentos').insert({
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

  if (!cliente) return <div>Acesso negado</div>;

  const steps = [
    { key: 'service', label: 'Serviço', icon: Scissors },
    { key: 'barber', label: 'Barbeiro', icon: User },
    { key: 'date', label: 'Data', icon: Calendar },
    { key: 'time', label: 'Horário', icon: Clock },
    { key: 'confirm', label: 'Confirmar', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/painel-cliente/agendamentos')} className="hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Novo Agendamento</h1>
              <p className="text-sm text-muted-foreground">Selecione os detalhes do seu atendimento</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 md:gap-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.key;
              const isCompleted = currentStepIndex > index;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className={cn("flex items-center justify-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-lg transition-all w-full", isActive && "bg-primary/10 border-2 border-primary", isCompleted && "bg-green-500/10 border-2 border-green-500", !isActive && !isCompleted && "bg-muted/50 border border-border")}>
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary", isCompleted && "text-green-500", !isActive && !isCompleted && "text-muted-foreground")} />
                    <span className={cn("text-xs md:text-sm font-medium truncate hidden sm:inline", isActive && "text-primary", isCompleted && "text-green-500", !isActive && !isCompleted && "text-muted-foreground")}>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {currentStep === 'service' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Escolha o Serviço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => (
                  <Card
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={cn("p-4 border rounded-md cursor-pointer hover:shadow-md transition-all", selectedService?.id === service.id ? "border-primary" : "border-muted")}
                  >
                    <h3 className="text-lg font-medium">{service.nome}</h3>
                    <p className="text-sm text-muted-foreground">R$ {service.preco.toFixed(2)} - {service.duracao} min</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'barber' && selectedService && (
            <div className="space-y-4">
              <Button variant="outline" onClick={handleBack}>Voltar</Button>
              <h2 className="text-xl font-semibold">Escolha o Barbeiro</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {barbers.map(barber => (
                  <Card
                    key={barber.id}
                    onClick={() => handleBarberSelect(barber)}
                    className={cn("p-4 border rounded-md cursor-pointer hover:shadow-md transition-all", selectedBarber?.id === barber.id ? "border-primary" : "border-muted")}
                  >
                    <h3 className="text-lg font-medium">{barber.nome}</h3>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'date' && selectedBarber && (
            <div className="space-y-4">
              <Button variant="outline" onClick={handleBack}>Voltar</Button>
              <h2 className="text-xl font-semibold">Escolha a Data</h2>
              {isLoading ? (
                <div>Carregando datas...</div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {availableDates.map(date => (
                    <Card
                      key={date.toISOString()}
                      onClick={() => handleDateSelect(date)}
                      className={cn("p-2 border rounded-md cursor-pointer hover:shadow-md transition-all text-center", selectedDate?.getTime() === date.getTime() ? "border-primary" : "border-muted")}
                    >
                      <div>{format(date, 'dd/MM', { locale: ptBR })}</div>
                      <div>{format(date, 'EEE', { locale: ptBR })}</div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 'time' && selectedDate && (
            <div className="space-y-4">
              <Button variant="outline" onClick={handleBack}>Voltar</Button>
              <h2 className="text-xl font-semibold">Escolha o Horário</h2>
              {isLoading ? (
                <div>Carregando horários...</div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {availableTimes
                    .filter(slot => slot.available)
                    .map(slot => (
                      <Card
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={cn("p-2 border rounded-md cursor-pointer hover:shadow-md transition-all text-center", selectedTime === slot.time ? "border-primary" : "border-muted")}
                      >
                        <div>{slot.time}</div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 'confirm' && selectedService && selectedBarber && selectedDate && selectedTime && (
            <div className="space-y-4">
              <Button variant="outline" onClick={handleBack}>Voltar</Button>
              <h2 className="text-xl font-semibold">Confirme seu Agendamento</h2>
              <Card className="p-4">
                <p>Serviço: {selectedService.nome}</p>
                <p>Barbeiro: {selectedBarber.nome}</p>
                <p>Data: {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}</p>
                <p>Horário: {selectedTime}</p>
                <Label htmlFor="notes">Observações:</Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma observação?" />
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
