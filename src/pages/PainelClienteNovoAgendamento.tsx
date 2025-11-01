import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { usePainelClienteAuth } from '@/contexts/PainelClienteAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import { toast } from 'sonner';

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
  
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

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

  // Gerar horários disponíveis quando barbeiro e data são selecionados
  useEffect(() => {
    const generateAvailableTimes = async () => {
      if (!selectedBarber || !selectedDate) {
        setAvailableTimes([]);
        return;
      }

      const weekday = selectedDate.getDay();
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      try {
        // Buscar staff_id do barbeiro selecionado
        const selectedBarberData = barbers.find(b => b.id === selectedBarber);
        if (!selectedBarberData?.staff_id) {
          setAvailableTimes([]);
          return;
        }

        // Buscar horário de trabalho do barbeiro via staff_id
        const { data: schedules } = await supabase
          .from('barber_schedules')
          .select('start_time, end_time')
          .eq('barber_id', selectedBarberData.staff_id)
          .eq('weekday', weekday)
          .eq('is_active', true)
          .single();

        if (!schedules) {
          setAvailableTimes([]);
          return;
        }

        // Buscar agendamentos existentes apenas do painel
        const { data: existingAppointments } = await supabase
          .from('painel_agendamentos')
          .select('hora')
          .eq('barbeiro_id', selectedBarber)
          .eq('data', dateStr)
          .not('status', 'eq', 'cancelado');

        const bookedTimes = existingAppointments?.map(apt => apt.hora) || [];

        // Gerar horários disponíveis (intervalos de 30 minutos)
        const times: string[] = [];
        const startHour = parseInt(schedules.start_time.split(':')[0]);
        const endHour = parseInt(schedules.end_time.split(':')[0]);

        for (let hour = startHour; hour < endHour; hour++) {
          const timeSlots = [`${hour.toString().padStart(2, '0')}:00`, `${hour.toString().padStart(2, '0')}:30`];
          timeSlots.forEach(time => {
            if (!bookedTimes.includes(time)) {
              times.push(time);
            }
          });
        }

        setAvailableTimes(times);
      } catch (error) {
      console.error('Erro ao gerar horários:', error);
        setAvailableTimes([]);
      }
    };

    generateAvailableTimes();
  }, [selectedBarber, selectedDate, barbers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente || !selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
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
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.length > 0 ? (
                      availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {time}
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