import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberData } from '@/hooks/barber/useBarberData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Clock, Lock, Unlock, AlertCircle, CalendarDays } from 'lucide-react';
import { format, addDays, isBefore, startOfDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string;
  isBlocked: boolean;
  hasAppointment: boolean;
  blockId?: string;
}

interface BlockedSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason: string | null;
}

const SlotBlockManager: React.FC = () => {
  const { barberData } = useBarberData();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Gerar slots de 08:30 às 19:30 (intervalos de 30 min)
  const generateTimeSlots = useCallback((): string[] => {
    const slots: string[] = [];
    const startHour = 8;
    const startMinute = 30;
    const endHour = 19;
    const endMinute = 30;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute of [0, 30]) {
        // Pular 08:00 - primeiro slot é 08:30
        if (hour === startHour && minute < startMinute) continue;
        // Parar após 19:30
        if (hour === endHour && minute > endMinute) break;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }

    return slots;
  }, []);

  // Buscar bloqueios e agendamentos para a data selecionada
  const fetchData = useCallback(async () => {
    if (!barberData?.staff_id) return;

    setLoading(true);
    try {
      // Buscar bloqueios
      const { data: blocksData, error: blocksError } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', barberData.staff_id)
        .eq('date', selectedDate);

      if (blocksError) throw blocksError;
      setBlockedSlots(blocksData || []);

      // Buscar agendamentos do dia
      const startOfDayStr = `${selectedDate}T00:00:00`;
      const endOfDayStr = `${selectedDate}T23:59:59`;

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('painel_agendamentos')
        .select('id, data_hora, servico:servico_id(duracao)')
        .eq('barbeiro_id', barberData.staff_id)
        .gte('data_hora', startOfDayStr)
        .lte('data_hora', endOfDayStr)
        .not('status', 'in', '("cancelado","ausente")');

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [barberData?.staff_id, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Montar lista de slots com status
  useEffect(() => {
    const timeSlots = generateTimeSlots();
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const isSelectedDateToday = isToday(new Date(selectedDate + 'T12:00:00'));

    const slotsWithStatus: TimeSlot[] = timeSlots.map(time => {
      // Verificar se está bloqueado
      const block = blockedSlots.find(b => 
        b.start_time.substring(0, 5) === time && !b.is_available
      );

      // Verificar se tem agendamento
      const hasAppointment = appointments.some(apt => {
        const aptTime = format(new Date(apt.data_hora), 'HH:mm');
        return aptTime === time;
      });

      // Se for hoje e o horário já passou, marcar como não disponível
      const isPast = isSelectedDateToday && time < currentTime;

      return {
        time,
        isBlocked: !!block || isPast,
        hasAppointment,
        blockId: block?.id,
      };
    });

    setSlots(slotsWithStatus);
  }, [blockedSlots, appointments, selectedDate, generateTimeSlots]);

  // Bloquear/Desbloquear slot
  const toggleSlotBlock = async (slot: TimeSlot) => {
    if (!barberData?.staff_id) return;
    if (slot.hasAppointment) {
      toast.error('Este horário possui um agendamento');
      return;
    }

    // Verificar se é um horário passado
    const now = new Date();
    const slotDateTime = new Date(`${selectedDate}T${slot.time}:00`);
    if (isBefore(slotDateTime, now)) {
      toast.error('Não é possível alterar horários passados');
      return;
    }

    setSaving(slot.time);
    try {
      if (slot.isBlocked && slot.blockId) {
        // Desbloquear - remover registro
        const { error } = await supabase
          .from('barber_availability')
          .delete()
          .eq('id', slot.blockId);

        if (error) throw error;
        toast.success(`Horário ${slot.time} liberado!`);
      } else {
        // Bloquear - criar registro
        const endTime = calculateEndTime(slot.time);
        const { error } = await supabase
          .from('barber_availability')
          .insert({
            barber_id: barberData.staff_id,
            date: selectedDate,
            start_time: `${slot.time}:00`,
            end_time: `${endTime}:00`,
            is_available: false,
            reason: 'Bloqueio manual',
          });

        if (error) throw error;
        toast.success(`Horário ${slot.time} bloqueado!`);
      }

      await fetchData();
    } catch (error: any) {
      console.error('Erro ao alterar bloqueio:', error);
      toast.error('Erro ao alterar status do horário');
    } finally {
      setSaving(null);
    }
  };

  // Calcular horário de fim (30 min depois)
  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 30;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Navegação rápida de datas
  const quickDateButtons = [
    { label: 'Hoje', date: new Date() },
    { label: 'Amanhã', date: addDays(new Date(), 1) },
    { label: '+2 dias', date: addDays(new Date(), 2) },
  ];

  const getSlotStatus = (slot: TimeSlot) => {
    if (slot.hasAppointment) return 'occupied';
    if (slot.isBlocked) return 'blocked';
    return 'available';
  };

  const getSlotClasses = (slot: TimeSlot) => {
    const status = getSlotStatus(slot);
    const base = 'flex items-center justify-between p-3 rounded-lg border transition-all';
    
    switch (status) {
      case 'occupied':
        return cn(base, 'bg-blue-500/20 border-blue-500/40 text-blue-300');
      case 'blocked':
        return cn(base, 'bg-red-500/20 border-red-500/40 text-red-300');
      default:
        return cn(base, 'bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30');
    }
  };

  if (!barberData?.staff_id) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Dados do barbeiro não encontrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informativo */}
      <div className="backdrop-blur-sm bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <p className="text-xs sm:text-sm text-amber-300">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          Bloqueie horários específicos quando precisar se ausentar. Clique em um horário livre para bloqueá-lo.
        </p>
      </div>

      {/* Seletor de Data */}
      <div className="space-y-3">
        <Label className="text-urbana-light/70 text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Selecionar Data
        </Label>
        
        {/* Botões de data rápida */}
        <div className="flex flex-wrap gap-2">
          {quickDateButtons.map(({ label, date }) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(format(date, 'yyyy-MM-dd'))}
              className={cn(
                'border-urbana-gold/20 text-urbana-light hover:bg-urbana-gold/10 text-xs',
                selectedDate === format(date, 'yyyy-MM-dd') && 'bg-urbana-gold/20 border-urbana-gold/50'
              )}
            >
              {label}
            </Button>
          ))}
        </div>

        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={format(new Date(), 'yyyy-MM-dd')}
          className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-10 text-sm"
        />

        <p className="text-sm text-urbana-gold font-medium">
          {format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/50 border border-green-500/70" />
          <span className="text-urbana-light/70">Disponível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/50 border border-red-500/70" />
          <span className="text-urbana-light/70">Bloqueado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500/50 border border-blue-500/70" />
          <span className="text-urbana-light/70">Agendado</span>
        </div>
      </div>

      {/* Grade de Horários */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {slots.map((slot) => {
            const status = getSlotStatus(slot);
            const isSaving = saving === slot.time;
            const canToggle = status !== 'occupied';

            return (
              <button
                key={slot.time}
                onClick={() => canToggle && toggleSlotBlock(slot)}
                disabled={!canToggle || isSaving}
                className={cn(
                  getSlotClasses(slot),
                  !canToggle && 'cursor-not-allowed opacity-70',
                  canToggle && 'cursor-pointer'
                )}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{slot.time}</span>
                </div>
                
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === 'occupied' ? (
                  <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded">Agendado</span>
                ) : status === 'blocked' ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Resumo */}
      <div className="backdrop-blur-sm bg-urbana-black/30 border border-urbana-gold/20 rounded-xl p-4">
        <h4 className="text-sm font-medium text-urbana-light mb-2">Resumo do Dia</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">
              {slots.filter(s => getSlotStatus(s) === 'available').length}
            </p>
            <p className="text-xs text-urbana-light/60">Disponíveis</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">
              {slots.filter(s => getSlotStatus(s) === 'occupied').length}
            </p>
            <p className="text-xs text-urbana-light/60">Agendados</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-400">
              {slots.filter(s => getSlotStatus(s) === 'blocked' && !s.hasAppointment).length}
            </p>
            <p className="text-xs text-urbana-light/60">Bloqueados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotBlockManager;
