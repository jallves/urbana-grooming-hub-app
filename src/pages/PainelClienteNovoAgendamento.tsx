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
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Escolha o Serviço</h2>
                  <p className="text-sm text-muted-foreground">Selecione o serviço desejado</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service, index) => (
                  <Card key={service.id} onClick={() => handleServiceSelect(service)} className={cn("group p-4 md:p-6 cursor-pointer transition-all duration-300", "bg-card/80 backdrop-blur-sm border-2 hover:shadow-xl", "animate-in fade-in slide-in-from-bottom-4", selectedService?.id === service.id ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "border-border hover:border-primary/50 hover:scale-[1.02]")} style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", selectedService?.id === service.id ? "bg-primary/20 border-2 border-primary" : "bg-muted border border-border group-hover:bg-primary/10")}>
                          <Scissors className={cn("w-5 h-5 transition-colors", selectedService?.id === service.id ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        {selectedService?.id === service.id && <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-base md:text-lg text-foreground line-clamp-1">{service.nome}</h3>
                        {service.descricao && <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">{service.descricao}</p>}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-lg md:text-xl font-bold text-primary">R$ {service.preco.toFixed(2)}</span>
                        <span className="text-xs md:text-sm text-muted-foreground">{service.duracao} min</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'barber' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-primary/10"><ArrowLeft className="w-5 h-5" /></Button>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-6 h-6 text-primary" /></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Escolha o Barbeiro</h2>
                  <p className="text-sm text-muted-foreground">Selecione o profissional</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {barbers.map((barber, index) => (
                  <Card key={barber.id} onClick={() => handleBarberSelect(barber)} className={cn("group p-4 md:p-6 cursor-pointer transition-all duration-300", "bg-card/80 backdrop-blur-sm border-2 hover:shadow-xl", "animate-in fade-in slide-in-from-bottom-4", selectedBarber?.id === barber.id ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]" : "border-border hover:border-primary/50 hover:scale-[1.02]")} style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", selectedBarber?.id === barber.id ? "bg-primary/20 border-2 border-primary" : "bg-muted border border-border group-hover:bg-primary/10")}>
                          <User className={cn("w-5 h-5 transition-colors", selectedBarber?.id === barber.id ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        {selectedBarber?.id === barber.id && <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-base md:text-lg text-foreground">{barber.nome}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">{barber.email}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'date' && (
            <div className="space-y-4 animate-in fade-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-primary/10"><ArrowLeft className="w-5 h-5" /></Button>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Calendar className="w-6 h-6 text-primary" /></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Escolha a Data</h2>
                  <p className="text-sm text-muted-foreground">Selecione o dia desejado</p>
                </div>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando datas...</p>
                </div>
              ) : availableDates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {availableDates.map((date, index) => {
                    const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                      <Card key={date.toISOString()} onClick={() => handleDateSelect(date)} className={cn("group p-4 cursor-pointer transition-all duration-300", "bg-card/80 backdrop-blur-sm border-2 hover:shadow-xl", "animate-in fade-in slide-in-from-bottom-4", isSelected ? "border-primary shadow-lg shadow-primary/20 scale-[1.05]" : "border-border hover:border-primary/50 hover:scale-[1.05]")} style={{ animationDelay: `${index * 30}ms` }}>
                        <div className="flex flex-col items-center gap-2 text-center">
                          <span className={cn("text-xs font-medium uppercase", isSelected ? "text-primary" : "text-muted-foreground")}>{format(date, 'EEE', { locale: ptBR })}</span>
                          <span className={cn("text-2xl md:text-3xl font-bold", isSelected ? "text-primary" : "text-foreground")}>{format(date, 'dd')}</span>
                          <span className={cn("text-xs", isSelected ? "text-primary" : "text-muted-foreground")}>{format(date, 'MMM', { locale: ptBR })}</span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in mt-1" />}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma data disponível</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'time' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-primary/10"><ArrowLeft className="w-5 h-5" /></Button>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Clock className="w-6 h-6 text-primary" /></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Escolha o Horário</h2>
                  <p className="text-sm text-muted-foreground">Selecione o melhor horário</p>
                </div>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando horários...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {availableTimes.filter(slot => slot.available).map((slot, index) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <Card key={slot.time} onClick={() => handleTimeSelect(slot.time)} className={cn("group p-3 md:p-4 cursor-pointer transition-all duration-300", "bg-card/80 backdrop-blur-sm border-2 hover:shadow-xl", "animate-in fade-in slide-in-from-bottom-4", isSelected ? "border-primary shadow-lg shadow-primary/20 scale-[1.05]" : "border-border hover:border-primary/50 hover:scale-[1.05]")} style={{ animationDelay: `${index * 20}ms` }}>
                        <div className="flex flex-col items-center gap-1">
                          <Clock className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-sm md:text-base font-bold", isSelected ? "text-primary" : "text-foreground")}>{slot.time}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
              {availableTimes.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum horário disponível</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={handleBack} className="hover:bg-primary/10"><ArrowLeft className="w-5 h-5" /></Button>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-primary" /></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Confirmar Agendamento</h2>
                  <p className="text-sm text-muted-foreground">Revise os detalhes</p>
                </div>
              </div>
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-2 border-primary/20">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Scissors className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Serviço</p>
                      <p className="font-bold text-foreground">{selectedService?.nome}</p>
                      <p className="text-sm text-muted-foreground">R$ {selectedService?.preco.toFixed(2)} • {selectedService?.duracao} min</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><User className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Barbeiro</p>
                      <p className="font-bold text-foreground">{selectedBarber?.nome}</p>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Data e Horário</p>
                      <p className="font-bold text-foreground">{selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />{selectedTime}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Observações (opcional)</Label>
                <Textarea id="notes" placeholder="Adicione observações sobre o agendamento..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none bg-card/50 backdrop-blur-sm border-2 focus:border-primary" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleBack} className="flex-1" disabled={isLoading}>Voltar</Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={isLoading || isValidating}>
                  {isLoading || isValidating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
