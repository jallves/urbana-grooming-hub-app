import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppointmentValidation } from '@/hooks/useAppointmentValidation';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface Barber {
  id: string;
  nome: string;
  email: string;
  staff_id: string;
}

export default function PainelClienteNovoAgendamento() {
  const navigate = useNavigate();
  const { cliente } = usePainelClienteAuth();
  const { getAvailableTimeSlots, validateAppointment, isValidating } = useAppointmentValidation();
  
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<{ time: string; available: boolean; reason?: string }[]>([]);

  // Carregar serviços e barbeiros
  useEffect(() => {
    const fetchData = async () => {
      // Buscar serviços do painel
      const { data: servicesData } = await supabase
        .from('painel_servicos')
        .select('*')
        .order('nome');
      
      if (servicesData) {
        setServices(servicesData);
      }

      // Buscar barbeiros do painel
      const { data: barbersData } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, email, staff_id')
        .order('nome');
      
      if (barbersData) {
        setBarbers(barbersData);
      }
    };

    fetchData();
  }, []);

  // Gerar horários disponíveis quando barbeiro, data e serviço são selecionados
  useEffect(() => {
    const generateAvailableTimes = async () => {
      if (!selectedBarber || !selectedDate || !selectedService) {
        setAvailableTimes([]);
        return;
      }

      try {
        // Buscar staff_id do barbeiro selecionado
        const selectedBarberData = barbers.find(b => b.id === selectedBarber);
        if (!selectedBarberData?.staff_id) {
          setAvailableTimes([]);
          return;
        }

        // Buscar duração do serviço
        const selectedServiceData = services.find(s => s.id === selectedService);
        const serviceDuration = selectedServiceData?.duracao || 60;

        // Usar o hook de validação para obter horários disponíveis
        // Isso já filtra horários passados e com menos de 30 minutos
        const slots = await getAvailableTimeSlots(
          selectedBarberData.staff_id,
          selectedDate,
          serviceDuration
        );

        setAvailableTimes(slots);
      } catch (error) {
        console.error('Erro ao gerar horários:', error);
        setAvailableTimes([]);
      }
    };

    generateAvailableTimes();
  }, [selectedBarber, selectedDate, selectedService, barbers, services, getAvailableTimeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente || !selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      // Buscar staff_id e duração do serviço
      const selectedBarberData = barbers.find(b => b.id === selectedBarber);
      const selectedServiceData = services.find(s => s.id === selectedService);
      
      if (!selectedBarberData?.staff_id || !selectedServiceData) {
        toast.error('Dados inválidos. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Validar o agendamento antes de inserir
      const validation = await validateAppointment(
        selectedBarberData.staff_id,
        selectedDate,
        selectedTime,
        selectedServiceData.duracao
      );

      if (!validation.valid) {
        setIsLoading(false);
        return; // O toast de erro já foi exibido pelo hook
      }

      // Salvar diretamente em painel_agendamentos
      const { error } = await supabase
        .from('painel_agendamentos')
        .insert({
          cliente_id: cliente.id,
          barbeiro_id: selectedBarber,
          servico_id: selectedService,
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
      toast.error('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!cliente) {
    return <div>Acesso negado</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Novo Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Serviço */}
            <div className="space-y-2">
              <Label htmlFor="service">Serviço *</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.nome} - R$ {service.preco.toFixed(2)} ({service.duracao}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Barbeiro */}
            <div className="space-y-2">
              <Label htmlFor="barber">Barbeiro *</Label>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label>Data *</Label>
              <div className="border rounded-md p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => 
                    isBefore(date, startOfDay(new Date())) || 
                    isAfter(date, addDays(new Date(), 30))
                  }
                  className="rounded-md"
                />
              </div>
            </div>

            {/* Horário */}
            {selectedBarber && selectedDate && (
              <div className="space-y-2">
                <Label htmlFor="time">Horário *</Label>
                {isValidating ? (
                  <div className="text-sm text-muted-foreground">Carregando horários...</div>
                ) : (
                  <>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.filter(slot => slot.available).length > 0 ? (
                          availableTimes
                            .filter(slot => slot.available)
                            .map((slot) => (
                              <SelectItem key={slot.time} value={slot.time}>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {slot.time}
                                </div>
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="" disabled>
                            Nenhum horário disponível
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {availableTimes.length > 0 && availableTimes.filter(slot => slot.available).length === 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Não há horários disponíveis para esta data. Tente selecionar outro dia ou barbeiro.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma observação especial..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/painel-cliente/agendamentos')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading || 
                  !selectedService || 
                  !selectedBarber || 
                  !selectedDate || 
                  !selectedTime
                }
                className="flex-1"
              >
                {isLoading ? 'Agendando...' : 'Agendar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}