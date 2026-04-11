import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { calculateTotalAppointmentDuration } from '@/lib/utils/appointmentDuration';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, Users, Scissors, Loader2, AlertCircle, CheckCircle2, Plus, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExtraServicesBadge from '@/components/ui/ExtraServicesBadge';

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

interface Cliente {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
}

interface ExtraService {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface SlotConflict {
  time: string;
  clientName?: string;
  serviceName?: string;
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>('');
  const [selectedServicoId, setSelectedServicoId] = useState<string>('');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');

  // Extra services state
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [showExtraServiceSelect, setShowExtraServiceSelect] = useState(false);
  const [slotConflicts, setSlotConflicts] = useState<SlotConflict[]>([]);

  // Total duration including extras
  const totalDuration = useMemo(() => {
    const selectedServico = servicos.find(s => s.id === selectedServicoId);
    const baseDuration = selectedServico?.duracao || 0;
    const extraDuration = extraServices.reduce((sum, s) => sum + s.duracao, 0);
    return baseDuration + extraDuration;
  }, [servicos, selectedServicoId, extraServices]);

  // Total price including extras
  const totalPrice = useMemo(() => {
    const selectedServico = servicos.find(s => s.id === selectedServicoId);
    const basePrice = selectedServico?.preco || 0;
    const extraPrice = extraServices.reduce((sum, s) => sum + s.preco, 0);
    return basePrice + extraPrice;
  }, [servicos, selectedServicoId, extraServices]);

  // Available extra services (exclude main + already added)
  const availableExtraServices = useMemo(() => {
    const usedIds = new Set([selectedServicoId, ...extraServices.map(s => s.id)].filter(Boolean));
    return servicos.filter(s => !usedIds.has(s.id));
  }, [servicos, selectedServicoId, extraServices]);

  // Carregar dados iniciais quando o dialog abrir
  useEffect(() => {
    if (isOpen && appointmentId) {
      loadAppointmentData();
      loadBarbeiros();
      loadServicos();
      loadClientes();
    }
  }, [isOpen, appointmentId]);

  // Buscar horários disponíveis quando mudar barbeiro, data, serviço ou extras
  useEffect(() => {
    if (selectedBarbeiroId && selectedDate && selectedServicoId) {
      fetchAvailableSlots();
    }
  }, [selectedBarbeiroId, selectedDate, selectedServicoId, totalDuration]);

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
      setSelectedClienteId(data.cliente_id || '');
      
      // Load existing extra services
      if (data.servicos_extras && Array.isArray(data.servicos_extras)) {
        setExtraServices(data.servicos_extras.map((s: any) => ({
          id: s.id || s.servico_id,
          nome: s.nome,
          preco: Number(s.preco) || 0,
          duracao: Number(s.duracao) || 30,
        })));
      } else {
        setExtraServices([]);
      }
      
      console.log('📋 [Admin Edit] Agendamento carregado:', {
        id: appointmentId,
        data: data.data,
        hora: data.hora?.substring(0, 5),
        barbeiro: data.painel_barbeiros?.nome,
        servico: data.painel_servicos?.nome,
        extras: data.servicos_extras?.length || 0
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

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('id, nome, whatsapp, email')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const handleAddExtraService = (serviceId: string) => {
    const service = servicos.find(s => s.id === serviceId);
    if (service) {
      setExtraServices(prev => [...prev, {
        id: service.id,
        nome: service.nome,
        preco: service.preco,
        duracao: service.duracao,
      }]);
      setShowExtraServiceSelect(false);
    }
  };

  const handleRemoveExtraService = (serviceId: string) => {
    setExtraServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedBarbeiroId || !selectedDate || !selectedServicoId) return;
    
    setLoadingSlots(true);
    setSlotConflicts([]);

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const serviceDuration = totalDuration || 30;
      const dayOfWeek = selectedDate.getDay();

      // Resolver staff_id do barbeiro para buscar working_hours
      const selectedBarber = barbeiros.find(b => b.id === selectedBarbeiroId);
      const authStaffId = selectedBarber?.staff_id || selectedBarbeiroId;

      const [staffResult, , appointmentsResult] = await Promise.all([
        supabase
          .from('staff')
          .select('id')
          .eq('staff_id', authStaffId)
          .maybeSingle(),
        Promise.resolve(null),
        supabase
          .from('painel_agendamentos')
          .select('id, hora, servicos_extras, cliente_id, servico_id, servico:painel_servicos(duracao, nome), cliente:painel_clientes(nome)')
          .eq('barbeiro_id', selectedBarbeiroId)
          .eq('data', formattedDate)
          .neq('status', 'cancelado')
      ]);

      const staffTableId = staffResult.data?.id || authStaffId;

      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('start_time, end_time')
        .eq('staff_id', staffTableId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .maybeSingle();

      const appointments = appointmentsResult.data;

      const startTime = workingHours?.start_time || '08:30';
      const endTime = workingHours?.end_time || '20:00';
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]) || 0;
      const endHour = parseInt(endTime.split(':')[0]);
      const endMinute = parseInt(endTime.split(':')[1]) || 0;

      const originalTime = appointment?.hora?.substring(0, 5);
      const originalDate = appointment?.data;
      const isOriginalDateAndBarber = formattedDate === originalDate && selectedBarbeiroId === appointment?.barbeiro_id;

      // Build occupied slots map with conflict info
      const BUFFER_MINUTES = 10;
      const occupiedSlots = new Map<string, { clientName?: string; serviceName?: string }>();
      
      appointments?.forEach((apt: any) => {
        if (apt.id === appointmentId) return;
        const mainDuration = (apt.servico as any)?.duracao || 60;
        const aptDuration = calculateTotalAppointmentDuration(mainDuration, (apt as any).servicos_extras);
        const [aH, aM] = apt.hora.split(':').map(Number);
        const aptStartMin = aH * 60 + aM;
        const totalBlock = aptDuration + BUFFER_MINUTES;
        
        for (let i = 0; i < totalBlock; i += 30) {
          const slotMin = aptStartMin + i;
          const h = Math.floor(slotMin / 60);
          const m = slotMin % 60;
          occupiedSlots.set(
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
            { clientName: (apt.cliente as any)?.nome, serviceName: (apt.servico as any)?.nome }
          );
        }
      });

      // Check for conflicts with the selected time + total duration
      const conflicts: SlotConflict[] = [];
      if (selectedTime) {
        const [stH, stM] = selectedTime.split(':').map(Number);
        const selectedStartMin = stH * 60 + stM;
        for (let i = 0; i < serviceDuration; i += 30) {
          const checkMin = selectedStartMin + i;
          const checkH = Math.floor(checkMin / 60);
          const checkM = checkMin % 60;
          const checkStr = `${checkH.toString().padStart(2, '0')}:${checkM.toString().padStart(2, '0')}`;
          const conflict = occupiedSlots.get(checkStr);
          if (conflict) {
            conflicts.push({ time: checkStr, ...conflict });
          }
        }
      }
      setSlotConflicts(conflicts);

      // Generate slots
      const allSlots: TimeSlot[] = [];
      
      for (let hour = startHour; hour <= endHour; hour++) {
        for (const minute of [0, 30]) {
          if (hour === startHour && minute < startMinute) continue;
          
          const slotTotalMinutes = hour * 60 + minute;
          const endTotalMinutes = endHour * 60 + endMinute;
          
          if (slotTotalMinutes + serviceDuration > endTotalMinutes) continue;
          
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const isOriginalSlot = isOriginalDateAndBarber && timeString === originalTime;
          
          if (isOriginalSlot) {
            allSlots.push({ time: timeString, available: true });
            continue;
          }
          
          let isAvailable = true;
          for (let i = 0; i < serviceDuration; i += 30) {
            const checkMin = slotTotalMinutes + i;
            const checkH = Math.floor(checkMin / 60);
            const checkM = checkMin % 60;
            const checkStr = `${checkH.toString().padStart(2, '0')}:${checkM.toString().padStart(2, '0')}`;
            if (occupiedSlots.has(checkStr)) {
              isAvailable = false;
              break;
            }
          }
          
          allSlots.push({ time: timeString, available: isAvailable });
        }
      }

      setAvailableSlots(allSlots);
      
      if (selectedTime && !allSlots.find(s => s.time === selectedTime && s.available)) {
        if (selectedTime !== originalTime || !isOriginalDateAndBarber) {
          setSelectedTime('');
        }
      }
    } catch (error) {
      console.error('❌ [Admin Edit] Erro ao buscar horários:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedBarbeiroId, selectedDate, selectedServicoId, servicos, appointmentId, appointment, barbeiros, totalDuration, selectedTime]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTime('');
      setCalendarOpen(false);
    }
  };

  const handleBarbeiroChange = (barbeiroId: string) => {
    setSelectedBarbeiroId(barbeiroId);
    setSelectedTime('');
  };

  const handleServicoChange = (servicoId: string) => {
    setSelectedServicoId(servicoId);
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

      const updateData: any = {
        data: dataFormatada,
        hora: horaFormatada,
        barbeiro_id: selectedBarbeiroId,
        servico_id: selectedServicoId,
        servicos_extras: extraServices.length > 0 ? extraServices.map(s => ({
          id: s.id,
          servico_id: s.id,
          nome: s.nome,
          preco: s.preco,
          duracao: s.duracao,
        })) : null,
      };

      if (selectedClienteId && selectedClienteId !== appointment.cliente_id) {
        updateData.cliente_id = selectedClienteId;
      }

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
  const selectedCliente = clientes.find(c => c.id === selectedClienteId);
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
          {/* Seleção de Cliente */}
          {appointment.status !== 'concluido' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                Cliente
              </Label>
              <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                <SelectTrigger className="h-11 bg-background border-input">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60">
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span>{cliente.nome}</span>
                        {cliente.whatsapp && (
                          <span className="text-muted-foreground text-xs">• {cliente.whatsapp}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                  <SelectItem key={barbeiro.id} value={barbeiro.id} className="cursor-pointer">
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Serviço Principal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              Serviço Principal
            </Label>
            <Select value={selectedServicoId} onValueChange={handleServicoChange}>
              <SelectTrigger className="h-11 bg-background border-input">
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id} className="cursor-pointer">
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

          {/* Serviços Extras */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4 text-muted-foreground" />
                Serviços Extras
              </Label>
              {availableExtraServices.length > 0 && !showExtraServiceSelect && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtraServiceSelect(true)}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </Button>
              )}
            </div>

            {/* Select para adicionar extra */}
            {showExtraServiceSelect && (
              <div className="flex gap-2">
                <Select onValueChange={handleAddExtraService}>
                  <SelectTrigger className="h-10 text-sm flex-1 bg-background border-input">
                    <SelectValue placeholder="Selecione serviço extra" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-60">
                    {availableExtraServices.map(s => (
                      <SelectItem key={s.id} value={s.id} className="cursor-pointer">
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{s.nome}</span>
                          <span className="text-muted-foreground text-xs">
                            R$ {s.preco.toFixed(2)} • {s.duracao}min
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExtraServiceSelect(false)}
                  className="h-10 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Lista de extras adicionados */}
            {extraServices.length > 0 ? (
              <div className="space-y-2">
                {extraServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-2.5 rounded-md bg-background border border-border">
                    <div>
                      <p className="text-sm font-medium">{service.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {service.preco.toFixed(2)} • {service.duracao}min
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExtraService(service.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Nenhum serviço extra adicionado</p>
            )}

            {/* Resumo de duração e preço total */}
            {(selectedServico || extraServices.length > 0) && (
              <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                <span className="text-muted-foreground">
                  Duração total: <span className="font-medium text-foreground">{totalDuration}min</span>
                </span>
                <span className="text-muted-foreground">
                  Total: <span className="font-semibold text-primary">R$ {totalPrice.toFixed(2)}</span>
                </span>
              </div>
            )}
          </div>

          {/* Alerta de conflitos de slots */}
          {slotConflicts.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-semibold">Atenção: Sobreposição de horários</span>
              </div>
              <p className="text-xs text-destructive/80">
                Os serviços extras vão consumir slots que possuem agendamentos:
              </p>
              <ul className="text-xs space-y-1">
                {slotConflicts.map((conflict, i) => (
                  <li key={i} className="flex items-center gap-1 text-destructive/90">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{conflict.time}</span>
                    {conflict.clientName && <span>— {conflict.clientName}</span>}
                    {conflict.serviceName && <span className="text-muted-foreground">({conflict.serviceName})</span>}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Como administrador, você pode prosseguir com a sobreposição.
              </p>
            </div>
          )}

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
                {totalDuration > 30 && (
                  <span className="text-muted-foreground text-xs">
                    (ocupa {Math.ceil(totalDuration / 30)} slots)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Resumo */}
          {selectedBarbeiro && selectedServico && selectedDate && selectedTime && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <h4 className="text-sm font-semibold text-primary">Resumo da Alteração</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedCliente && selectedCliente.id !== appointment.cliente_id && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Cliente:</span>
                    <p className="font-medium text-primary">{selectedCliente.nome} ⬅ alterado</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Barbeiro:</span>
                  <p className="font-medium">{selectedBarbeiro.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Serviço:</span>
                  <p className="font-medium">{selectedServico.nome}</p>
                </div>
                {extraServices.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Extras:</span>
                    <p className="font-medium">{extraServices.map(s => s.nome).join(', ')}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium">{format(selectedDate, "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Horário:</span>
                  <p className="font-medium">{selectedTime}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-semibold text-primary">R$ {totalPrice.toFixed(2)} • {totalDuration}min</p>
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
