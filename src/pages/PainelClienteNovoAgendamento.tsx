import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Scissors, User } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';
import { TotemCard, TotemCardTitle } from '@/components/totem/TotemCard';
import { TotemGrid } from '@/components/totem/TotemLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  // Carregar barbeiros quando selecionar serviço
  useEffect(() => {
    if (selectedService) {
      loadBarbers();
    }
  }, [selectedService]);

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

  // Carregar datas disponíveis quando selecionar barbeiro
  useEffect(() => {
    if (selectedBarber && selectedService) {
      loadAvailableDates();
    }
  }, [selectedBarber, selectedService]);

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
          selectedService!.duracao || 60
        );
        
        // Se tem pelo menos um horário disponível, adicionar a data
        if (slots.some(slot => slot.available)) {
          dates.push(date);
        }
      }
      
      setAvailableDates(dates);
      
      // Selecionar automaticamente a primeira data disponível
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar datas:', error);
      toast.error('Erro ao carregar datas disponíveis');
    } finally {
      setLoading(false);
    }
  };

  // Carregar horários quando selecionar data
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
        selectedService.duracao || 60
      );
      
      setTimeSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('barber');
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep('datetime');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos');
      return;
    }

    setCreating(true);
    try {
      // Obter cliente logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado');
        navigate('/painel-cliente/login');
        return;
      }

      // Buscar cliente
      const { data: cliente, error: clientError } = await supabase
        .from('painel_clientes')
        .select('*')
        .eq('email', user.email)
        .single();

      if (clientError || !cliente) {
        toast.error('Cliente não encontrado');
        return;
      }

      // Validação
      const validation = await validateAppointment(
        selectedBarber.id,
        selectedDate,
        selectedTime,
        selectedService.duracao || 60
      );

      if (!validation.valid) {
        setCreating(false);
        return;
      }

      // Formatar data
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dataLocal = `${year}-${month}-${day}`;

      // Criar agendamento
      const { error } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: cliente.id,
          barbeiro_id: selectedBarber.id,
          servico_id: selectedService.id,
          data: dataLocal,
          hora: selectedTime,
          status: 'agendado'
        });

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        toast.error('Erro ao criar agendamento');
        return;
      }

      toast.success('Agendamento criado com sucesso!');
      navigate('/painel-cliente/agendamentos');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="border-primary/20 shadow-2xl">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Novo Agendamento
            </CardTitle>
            <CardDescription className="text-base">
              {step === 'service' && 'Escolha o serviço desejado'}
              {step === 'barber' && 'Selecione o barbeiro de sua preferência'}
              {step === 'datetime' && 'Escolha a data e horário'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Resumo do agendamento */}
            {(selectedService || selectedBarber || selectedDate) && (
              <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/10">
                <h3 className="font-semibold text-sm text-muted-foreground">Resumo</h3>
                <div className="space-y-1 text-sm">
                  {selectedService && (
                    <p className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-primary" />
                      <span className="font-medium">{selectedService.nome}</span>
                      <span className="text-muted-foreground">- R$ {selectedService.preco.toFixed(2)}</span>
                    </p>
                  )}
                  {selectedBarber && (
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">{selectedBarber.nome}</span>
                    </p>
                  )}
                  {selectedDate && selectedTime && (
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Selecionar Serviço */}
            {step === 'service' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  Selecione o Serviço
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <TotemGrid columns={3} gap={3}>
                    {services.map((service) => (
                      <TotemCard
                        key={service.id}
                        icon={Scissors}
                        variant={selectedService?.id === service.id ? 'selected' : 'default'}
                        onClick={() => handleServiceSelect(service)}
                        className="cursor-pointer"
                      >
                        <TotemCardTitle>{service.nome}</TotemCardTitle>
                        <p className="text-sm text-muted-foreground">
                          R$ {service.preco.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.duracao} min
                        </p>
                      </TotemCard>
                    ))}
                  </TotemGrid>
                )}
              </div>
            )}

            {/* Step 2: Selecionar Barbeiro */}
            {step === 'barber' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Selecione o Barbeiro
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('service')}
                  >
                    Voltar
                  </Button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <TotemGrid columns={3} gap={3}>
                    {barbers.map((barber) => (
                      <TotemCard
                        key={barber.id}
                        icon={User}
                        variant={selectedBarber?.id === barber.id ? 'selected' : 'default'}
                        onClick={() => handleBarberSelect(barber)}
                        className="cursor-pointer"
                      >
                        {barber.image_url && (
                          <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-primary/10">
                            <img
                              src={barber.image_url}
                              alt={barber.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <TotemCardTitle>{barber.nome}</TotemCardTitle>
                      </TotemCard>
                    ))}
                  </TotemGrid>
                )}
              </div>
            )}

            {/* Step 3: Selecionar Data e Horário */}
            {step === 'datetime' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Selecione a Data
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('barber')}
                  >
                    Voltar
                  </Button>
                </div>

                {loading && !availableDates.length ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : availableDates.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Não há horários disponíveis nos próximos dias
                    </p>
                  </div>
                ) : (
                  <TotemGrid columns={4} gap={3}>
                    {availableDates.map((date) => (
                      <TotemCard
                        key={date.toISOString()}
                        icon={Calendar}
                        variant={
                          selectedDate && 
                          selectedDate.getDate() === date.getDate() &&
                          selectedDate.getMonth() === date.getMonth() &&
                          selectedDate.getFullYear() === date.getFullYear()
                            ? 'selected'
                            : 'default'
                        }
                        onClick={() => setSelectedDate(date)}
                        className="cursor-pointer"
                      >
                        <TotemCardTitle>
                          {format(date, "dd 'de' MMMM", { locale: ptBR })}
                        </TotemCardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(date, 'EEEE', { locale: ptBR })}
                        </p>
                      </TotemCard>
                    ))}
                  </TotemGrid>
                )}

                {/* Horários */}
                {selectedDate && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Selecione o Horário
                    </h3>
                    
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <TotemGrid columns={4} gap={3}>
                        {timeSlots.map((slot) => (
                          <TotemCard
                            key={slot.time}
                            icon={Clock}
                            variant={
                              !slot.available
                                ? 'disabled'
                                : selectedTime === slot.time
                                ? 'selected'
                                : 'default'
                            }
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            className={slot.available ? 'cursor-pointer' : 'cursor-not-allowed'}
                          >
                            <TotemCardTitle>{slot.time}</TotemCardTitle>
                            {!slot.available && slot.reason && (
                              <p className="text-xs text-muted-foreground">{slot.reason}</p>
                            )}
                          </TotemCard>
                        ))}
                      </TotemGrid>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botão de confirmação */}
            {selectedTime && (
              <div className="pt-6">
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  disabled={creating || isValidating}
                  className="w-full"
                >
                  {isValidating ? 'Validando...' : creating ? 'Criando...' : 'Confirmar Agendamento'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PainelClienteNovoAgendamento;
