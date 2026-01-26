import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  Lock, 
  Unlock,
  Loader2, 
  AlertCircle,
  CalendarDays,
  CalendarOff,
  User
} from 'lucide-react';
import { format, addDays, isToday, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Barber {
  id: string;
  nome: string;
  foto_url: string | null;
  staff_id: string | null;
  staffTableId: string | null;
}

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
}

interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const AdminBarberBlockManager: React.FC = () => {
  // Estados principais
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isDayOff, setIsDayOff] = useState(false);
  
  // Estados do formulário
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Estados de loading
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Buscar todos os barbeiros ativos
  useEffect(() => {
    const fetchBarbers = async () => {
      setLoadingBarbers(true);
      try {
        const { data: barbersData, error: barbersError } = await supabase
          .from('painel_barbeiros')
          .select('id, nome, foto_url, image_url, staff_id')
          .eq('ativo', true)
          .order('nome');

        if (barbersError) throw barbersError;

        const barbersWithStaffTableId: Barber[] = [];
        
        for (const barber of barbersData || []) {
          let staffTableId: string | null = null;
          
          if (barber.staff_id) {
            const { data: staffData } = await supabase
              .from('staff')
              .select('id')
              .eq('staff_id', barber.staff_id)
              .maybeSingle();
            
            staffTableId = staffData?.id || null;
          }
          
          barbersWithStaffTableId.push({
            id: barber.id,
            nome: barber.nome,
            foto_url: barber.foto_url || barber.image_url,
            staff_id: barber.staff_id,
            staffTableId
          });
        }

        setBarbers(barbersWithStaffTableId);
      } catch (error) {
        console.error('Erro ao buscar barbeiros:', error);
        toast.error('Erro ao carregar barbeiros');
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, []);

  // Quando selecionar um barbeiro, buscar seus horários de trabalho
  useEffect(() => {
    const barber = barbers.find(b => b.id === selectedBarberId);
    setSelectedBarber(barber || null);
    
    if (!barber?.staffTableId) {
      setWorkingHours([]);
      setBlockedSlots([]);
      return;
    }

    const fetchWorkingHours = async () => {
      const { data, error } = await supabase
        .from('working_hours')
        .select('day_of_week, start_time, end_time, is_active')
        .eq('staff_id', barber.staffTableId);

      if (!error && data) {
        setWorkingHours(data);
      }
    };

    fetchWorkingHours();
  }, [selectedBarberId, barbers]);

  // Verificar se o dia selecionado é dia de trabalho
  useEffect(() => {
    const selectedDateObj = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = getDay(selectedDateObj);
    
    const daySchedule = workingHours.find(wh => wh.day_of_week === dayOfWeek);
    setIsDayOff(!daySchedule || !daySchedule.is_active);
  }, [selectedDate, workingHours]);

  // Gerar slots baseados no horário de trabalho do dia
  const generateTimeSlots = useCallback((): string[] => {
    const selectedDateObj = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = getDay(selectedDateObj);
    
    const daySchedule = workingHours.find(wh => wh.day_of_week === dayOfWeek && wh.is_active);
    if (!daySchedule) return [];

    const generatedSlots: string[] = [];
    const [startHour, startMin] = daySchedule.start_time.split(':').map(Number);
    const [endHour, endMin] = daySchedule.end_time.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;

    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      generatedSlots.push(timeString);
    }

    return generatedSlots;
  }, [selectedDate, workingHours]);

  // Buscar bloqueios e agendamentos para a data selecionada
  const fetchData = useCallback(async () => {
    if (!selectedBarber?.staffTableId || isDayOff) {
      setBlockedSlots([]);
      setAppointments([]);
      return;
    }

    setLoading(true);
    try {
      const [blocksResult, appointmentsResult] = await Promise.all([
        supabase
          .from('barber_availability')
          .select('*')
          .eq('barber_id', selectedBarber.staffTableId)
          .eq('date', selectedDate),
        
        supabase
          .from('painel_agendamentos')
          .select('id, data, hora, servico:servico_id(duracao, nome)')
          .eq('barbeiro_id', selectedBarber.id)
          .eq('data', selectedDate)
          .not('status', 'in', '("cancelado","ausente")')
      ]);

      if (blocksResult.error) throw blocksResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;

      setBlockedSlots(blocksResult.data || []);
      setAppointments(appointmentsResult.data || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [selectedBarber, selectedDate, isDayOff]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Processar slots com status
  useEffect(() => {
    if (isDayOff || !selectedBarber) {
      setSlots([]);
      return;
    }

    const timeSlots = generateTimeSlots();
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const isSelectedDateToday = isToday(new Date(selectedDate + 'T12:00:00'));

    const slotsWithStatus: TimeSlot[] = timeSlots.map(time => {
      const block = blockedSlots.find(b => 
        b.start_time.substring(0, 5) === time && !b.is_available
      );

      const [slotHour, slotMin] = time.split(':').map(Number);
      const slotTotalMinutes = slotHour * 60 + slotMin;

      const hasAppointment = appointments.some(apt => {
        const aptTime = apt.hora?.substring(0, 5);
        if (!aptTime) return false;
        
        const [aptHour, aptMin] = aptTime.split(':').map(Number);
        const aptTotalMinutes = aptHour * 60 + aptMin;
        
        const duracao = apt.servico?.duracao || 30;
        const aptEndMinutes = aptTotalMinutes + duracao;
        
        return slotTotalMinutes >= aptTotalMinutes && slotTotalMinutes < aptEndMinutes;
      });

      const isPast = isSelectedDateToday && time < currentTime;

      return {
        time,
        isBlocked: !!block || isPast,
        hasAppointment,
        blockId: block?.id,
      };
    });

    setSlots(slotsWithStatus);
  }, [blockedSlots, appointments, selectedDate, generateTimeSlots, isDayOff, selectedBarber]);

  // Bloquear/Desbloquear slot
  const toggleSlotBlock = async (slot: TimeSlot) => {
    if (!selectedBarber?.staffTableId) return;
    if (slot.hasAppointment) {
      toast.error('Este horário possui um agendamento');
      return;
    }

    setSaving(slot.time);
    try {
      if (slot.isBlocked && slot.blockId) {
        const { error } = await supabase
          .from('barber_availability')
          .delete()
          .eq('id', slot.blockId);

        if (error) throw error;
        toast.success(`Horário ${slot.time} liberado!`);
      } else {
        const endTime = calculateEndTime(slot.time);
        const { error } = await supabase
          .from('barber_availability')
          .insert({
            barber_id: selectedBarber.staffTableId,
            date: selectedDate,
            start_time: `${slot.time}:00`,
            end_time: `${endTime}:00`,
            is_available: false,
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

  const calculateEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 30;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Navegação rápida de datas
  const getQuickDateButtons = useCallback(() => {
    const buttons: { label: string; date: Date }[] = [];
    let daysChecked = 0;
    let currentDate = new Date();

    while (buttons.length < 3 && daysChecked < 14) {
      const dayOfWeek = getDay(currentDate);
      const daySchedule = workingHours.find(wh => wh.day_of_week === dayOfWeek && wh.is_active);

      if (daySchedule) {
        if (daysChecked === 0) {
          buttons.push({ label: 'Hoje', date: new Date(currentDate) });
        } else if (buttons.length === 1) {
          buttons.push({ label: 'Próximo', date: new Date(currentDate) });
        } else {
          buttons.push({ label: format(currentDate, 'dd/MM'), date: new Date(currentDate) });
        }
      }

      currentDate = addDays(currentDate, 1);
      daysChecked++;
    }

    return buttons;
  }, [workingHours]);

  const quickDateButtons = getQuickDateButtons();

  const getSlotStatus = (slot: TimeSlot) => {
    if (slot.hasAppointment) return 'occupied';
    if (slot.isBlocked) return 'blocked';
    return 'available';
  };

  const getSlotClasses = (slot: TimeSlot) => {
    const status = getSlotStatus(slot);
    const base = 'flex items-center justify-between p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-150';
    
    switch (status) {
      case 'occupied':
        return cn(base, 'bg-blue-50 border-blue-300 text-blue-700');
      case 'blocked':
        return cn(base, 'bg-red-50 border-red-300 text-red-700');
      default:
        return cn(base, 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100');
    }
  };

  const getBarberInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loadingBarbers) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com informativo */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-amber-800 leading-relaxed flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Selecione um barbeiro e clique nos horários para bloquear/desbloquear. 
            Os bloqueios serão refletidos em todas as plataformas de agendamento.
          </span>
        </p>
      </div>

      {/* Seleção de Barbeiros com Cards */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <User className="h-4 w-4" />
          Selecionar Barbeiro
        </Label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {barbers.map(barber => {
            const isSelected = selectedBarberId === barber.id;
            return (
              <button
                key={barber.id}
                type="button"
                onClick={() => setSelectedBarberId(barber.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all',
                  isSelected 
                    ? 'border-urbana-gold bg-urbana-gold/10 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                )}
              >
                <Avatar className={cn(
                  'h-14 w-14 sm:h-16 sm:w-16 border-2',
                  isSelected ? 'border-urbana-gold' : 'border-gray-200'
                )}>
                  <AvatarImage src={barber.foto_url || ''} alt={barber.nome} />
                  <AvatarFallback className={cn(
                    'text-sm sm:text-base font-semibold',
                    isSelected ? 'bg-urbana-gold text-black' : 'bg-gray-100 text-gray-600'
                  )}>
                    {getBarberInitials(barber.nome)}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  'text-xs sm:text-sm font-medium text-center line-clamp-1',
                  isSelected ? 'text-gray-900' : 'text-gray-700'
                )}>
                  {barber.nome}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Se nenhum barbeiro selecionado */}
      {!selectedBarber && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 font-medium">Selecione um barbeiro</p>
          <p className="text-xs text-gray-500 mt-1">
            para gerenciar seus bloqueios de horário
          </p>
        </div>
      )}

      {/* Conteúdo quando barbeiro selecionado */}
      {selectedBarber && (
        <div className="space-y-4 bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
          {/* Header com foto e nome do barbeiro */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Avatar className="h-12 w-12 border-2 border-urbana-gold">
              <AvatarImage src={selectedBarber.foto_url || ''} alt={selectedBarber.nome} />
              <AvatarFallback className="bg-urbana-gold text-black font-semibold">
                {getBarberInitials(selectedBarber.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedBarber.nome}</h3>
              <p className="text-xs text-gray-500">Gerenciando bloqueios de horário</p>
            </div>
          </div>

          {/* Seletor de Data */}
          <div className="space-y-3">
            <Label className="text-gray-700 text-xs sm:text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Selecionar Data
            </Label>
            
            {/* Botões de data rápida */}
            {quickDateButtons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quickDateButtons.map(({ label, date }) => {
                  const isSelected = selectedDate === format(date, 'yyyy-MM-dd');
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedDate(format(date, 'yyyy-MM-dd'))}
                      className={cn(
                        'px-3 py-1.5 text-xs sm:text-sm rounded-lg border transition-colors font-medium',
                        isSelected 
                          ? 'bg-urbana-gold border-urbana-gold text-black' 
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="bg-white border-gray-300 text-gray-900 h-10"
            />

            <p className="text-sm text-gray-900 font-medium">
              {format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {/* Dia de folga */}
          {isDayOff ? (
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 text-center">
              <CalendarOff className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-700 font-medium">Dia de Folga</p>
              <p className="text-xs text-gray-500 mt-1">
                O barbeiro não trabalha neste dia
              </p>
            </div>
          ) : (
            <>
              {/* Legenda */}
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-400 flex items-center justify-center">
                    <Unlock className="h-2.5 w-2.5 text-green-600" />
                  </div>
                  <span className="text-gray-700">Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-400 flex items-center justify-center">
                    <Lock className="h-2.5 w-2.5 text-red-600" />
                  </div>
                  <span className="text-gray-700">Bloqueado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400" />
                  <span className="text-gray-700">Agendado</span>
                </div>
              </div>

              {/* Grade de Horários */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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
                          canToggle && 'cursor-pointer active:scale-95'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="font-semibold text-sm">{slot.time}</span>
                        </div>
                        
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : status === 'occupied' ? (
                          <span className="text-[10px] bg-blue-200 px-1.5 py-0.5 rounded font-medium">
                            Agend.
                          </span>
                        ) : status === 'blocked' ? (
                          <Lock className="h-4 w-4 text-red-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Resumo */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Resumo do Dia</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xl font-bold text-green-600">
                      {slots.filter(s => getSlotStatus(s) === 'available').length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Disponíveis</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xl font-bold text-blue-600">
                      {slots.filter(s => getSlotStatus(s) === 'occupied').length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Agendados</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xl font-bold text-red-600">
                      {slots.filter(s => getSlotStatus(s) === 'blocked' && !s.hasAppointment).length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Bloqueados</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBarberBlockManager;
