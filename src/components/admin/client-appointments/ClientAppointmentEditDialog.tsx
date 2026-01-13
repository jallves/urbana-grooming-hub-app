import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, Scissors, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientAppointmentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  onUpdate: (id: string, data: any, previousData?: {
    date?: string;
    time?: string;
    staffName?: string;
    serviceName?: string;
  }) => Promise<boolean>;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Barbeiro {
  id: string;
  nome: string;
  is_active?: boolean;
  staff_id?: string;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  is_active?: boolean;
}

const ClientAppointmentEditDialog: React.FC<ClientAppointmentEditDialogProps> = ({
  isOpen,
  onClose,
  appointmentId,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>('');
  const [selectedServicoId, setSelectedServicoId] = useState<string>('');

  // Carregar dados iniciais quando o dialog abrir
  useEffect(() => {
    if (isOpen && appointmentId) {
      loadAppointmentData();
      loadBarbeiros();
      loadServicos();
    }
  }, [isOpen, appointmentId]);

  // Buscar horários disponíveis quando mudar barbeiro, data ou serviço
  useEffect(() => {
    if (selectedBarbeiroId && selectedDate && selectedServicoId) {
      fetchAvailableSlots();
    }
  }, [selectedBarbeiroId, selectedDate, selectedServicoId]);

  const loadAppointmentData = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_clientes(nome, email, whatsapp),
          painel_barbeiros(id, nome),
          painel_servicos(id, nome, preco, duracao)
        `)
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      setAppointment(data);
      
      // Configurar estado inicial
      const dataAgendamento = new Date(data.data + 'T00:00:00');
      setSelectedDate(dataAgendamento);
      setSelectedTime(data.hora?.substring(0, 5) || '');
      setSelectedBarbeiroId(data.barbeiro_id);
      setSelectedServicoId(data.servico_id);
      
      console.log('📋 [Admin Edit] Agendamento carregado:', {
        id: appointmentId,
        data: data.data,
        hora: data.hora?.substring(0, 5),
        barbeiro: data.painel_barbeiros?.nome,
        servico: data.painel_servicos?.nome
      });
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Erro ao carregar dados do agendamento');
    }
  };

  const loadBarbeiros = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_barbeiros')
        .select('id, nome, is_active, staff_id')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      setBarbeiros(data || []);
    } catch (error) {
      console.error('Error loading barbeiros:', error);
    }
  };

  const loadServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_servicos')
        .select('id, nome, preco, duracao, is_active')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Error loading servicos:', error);
    }
  };

  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedBarbeiroId || !selectedDate || !selectedServicoId) return;
    
    setLoadingSlots(true);
    console.log('🕐 [Admin Edit] Buscando horários disponíveis:', {
      barbeiro: selectedBarbeiroId,
      data: format(selectedDate, 'yyyy-MM-dd'),
      servico: selectedServicoId
    });

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const selectedServico = servicos.find(s => s.id === selectedServicoId);
      const serviceDuration = selectedServico?.duracao || 30;
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isCurrentDay = isToday(selectedDate);
      
      // Configurar slots de 08:30 às 20:00
      const allSlots: TimeSlot[] = [];
      const FIRST_SLOT_HOUR = 8;
      const FIRST_SLOT_MINUTE = 30;
      const CLOSING_HOUR = 20;
      const CLOSING_MINUTE = 0;
      
      const closingTotalMinutes = CLOSING_HOUR * 60 + CLOSING_MINUTE;
      const lastSlotTotalMinutes = closingTotalMinutes - serviceDuration;
      
      for (let hour = FIRST_SLOT_HOUR; hour < CLOSING_HOUR; hour++) {
        for (let minute of [0, 30]) {
          if (hour === FIRST_SLOT_HOUR && minute < FIRST_SLOT_MINUTE) {
            continue;
          }
          
          const slotTotalMinutes = hour * 60 + minute;
          
          if (slotTotalMinutes > lastSlotTotalMinutes) {
            continue;
          }
          
          // Se for hoje, só incluir horários futuros
          if (isCurrentDay) {
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            if (slotTotalMinutes <= currentTotalMinutes + 30) {
              continue;
            }
          }
          
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          allSlots.push({ time: timeString, available: false });
        }
      }

      // Verificar disponibilidade de cada horário
      const slotsWithAvailability = await Promise.all(
        allSlots.map(async (slot) => {
          const { data, error } = await supabase
            .rpc('check_barber_slot_availability', {
              p_barber_id: selectedBarbeiroId,
              p_date: formattedDate,
              p_time: slot.time,
              p_duration: serviceDuration
            });

          if (error) {
            console.error('❌ Erro ao verificar slot:', error);
            return { ...slot, available: false };
          }

          return { ...slot, available: data === true };
        })
      );

      const availableCount = slotsWithAvailability.filter(s => s.available).length;
      console.log('✅ [Admin Edit] Slots disponíveis:', availableCount);

      setAvailableSlots(slotsWithAvailability);
      
      // Se o horário atual não está disponível, limpar seleção
      if (selectedTime && !slotsWithAvailability.find(s => s.time === selectedTime && s.available)) {
        // Manter o horário selecionado se for o mesmo do agendamento original
        const originalTime = appointment?.hora?.substring(0, 5);
        if (selectedTime !== originalTime) {
          setSelectedTime('');
        }
      }
    } catch (error) {
      console.error('❌ [Admin Edit] Erro ao buscar horários:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedBarbeiroId, selectedDate, selectedServicoId, servicos, appointmentId, appointment]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTime(''); // Limpar horário ao mudar data
      setCalendarOpen(false);
    }
  };

  const handleBarbeiroChange = (barbeiroId: string) => {
    setSelectedBarbeiroId(barbeiroId);
    setSelectedTime(''); // Limpar horário ao mudar barbeiro
  };

  const handleServicoChange = (servicoId: string) => {
    setSelectedServicoId(servicoId);
    setSelectedTime(''); // Limpar horário ao mudar serviço (duração pode ser diferente)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !selectedBarbeiroId || !selectedServicoId) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const horaFormatada = `${selectedTime}:00`;
      const dataFormatada = format(selectedDate, 'yyyy-MM-dd');

      const updateData = {
        data: dataFormatada,
        hora: horaFormatada,
        barbeiro_id: selectedBarbeiroId,
        servico_id: selectedServicoId
      };

      const previousData = {
        date: appointment.data,
        time: appointment.hora?.substring(0, 5),
        staffName: appointment.painel_barbeiros?.nome,
        serviceName: appointment.painel_servicos?.nome
      };

      console.log('📝 [Admin Edit] Atualizando:', updateData);
      
      const success = await onUpdate(appointmentId, updateData, previousData);
      if (success) {
        toast.success('Agendamento atualizado com sucesso!');
        onClose();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const selectedBarbeiro = barbeiros.find(b => b.id === selectedBarbeiroId);
  const selectedServico = servicos.find(s => s.id === selectedServicoId);
  const availableSlotsFiltered = availableSlots.filter(s => s.available);

  if (!appointment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-card text-card-foreground border-border">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Editar Agendamento
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Cliente: <span className="font-medium text-foreground">{appointment.painel_clientes?.nome}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Seleção de Barbeiro */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Barbeiro
            </Label>
            <Select value={selectedBarbeiroId} onValueChange={handleBarbeiroChange}>
              <SelectTrigger className="h-11 bg-background border-input">
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {barbeiros.map((barbeiro) => (
                  <SelectItem
                    key={barbeiro.id}
                    value={barbeiro.id}
                    className="cursor-pointer"
                  >
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Serviço */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              Serviço
            </Label>
            <Select value={selectedServicoId} onValueChange={handleServicoChange}>
              <SelectTrigger className="h-11 bg-background border-input">
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {servicos.map((servico) => (
                  <SelectItem
                    key={servico.id}
                    value={servico.id}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{servico.nome}</span>
                      <span className="text-muted-foreground text-xs">
                        R$ {servico.preco.toFixed(2)} • {servico.duracao}min
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Data */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Data
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal bg-background border-input",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate 
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "Selecione a data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => isBefore(date, startOfDay(new Date()))}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Seleção de Horário */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Horário Disponível
              {loadingSlots && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </Label>
            
            {!selectedBarbeiroId || !selectedDate || !selectedServicoId ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border border-border">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Selecione barbeiro, serviço e data para ver horários
                </span>
              </div>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : availableSlotsFiltered.length === 0 ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Nenhum horário disponível para esta data
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {availableSlotsFiltered.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    className={cn(
                      "h-10 px-2 text-sm rounded-lg font-medium transition-all duration-200",
                      selectedTime === slot.time 
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background" 
                        : "bg-muted hover:bg-muted/80 text-foreground border border-border hover:border-primary/50"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
            
            {selectedTime && (
              <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Horário selecionado: <span className="font-semibold">{selectedTime}</span>
              </div>
            )}
          </div>

          {/* Resumo */}
          {selectedBarbeiro && selectedServico && selectedDate && selectedTime && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <h4 className="text-sm font-semibold text-primary">Resumo da Alteração</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Barbeiro:</span>
                  <p className="font-medium">{selectedBarbeiro.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Serviço:</span>
                  <p className="font-medium">{selectedServico.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium">{format(selectedDate, "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Horário:</span>
                  <p className="font-medium">{selectedTime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedTime}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientAppointmentEditDialog;
