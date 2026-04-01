import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberData } from '@/hooks/barber/useBarberData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CalendarRange, Clock, Trash2, Plus, Repeat } from 'lucide-react';
import { format, addDays, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import ConfirmActionDialog from '@/components/admin/shared/ConfirmActionDialog';

interface RecurringBlockManagerProps {
  overrideBarberId?: string;
}

interface RecurringBlock {
  time: string;
  startDate: string;
  endDate: string;
  blockIds: string[];
}

interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAY_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

const RecurringBlockManager: React.FC<RecurringBlockManagerProps> = ({ overrideBarberId }) => {
  const { barberData } = useBarberData(overrideBarberId);
  const [staffTableId, setStaffTableId] = useState<string | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingBlocks, setExistingBlocks] = useState<RecurringBlock[]>([]);

  // Form state
  const [selectedTime, setSelectedTime] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // Resolve staff table ID
  useEffect(() => {
    const resolveStaffId = async () => {
      if (!barberData?.staff_id) { setStaffTableId(null); return; }
      const { data } = await supabase
        .from('staff')
        .select('id')
        .eq('staff_id', barberData.staff_id)
        .maybeSingle();
      setStaffTableId(data?.id ?? null);
    };
    resolveStaffId();
  }, [barberData?.staff_id]);

  // Fetch working hours
  useEffect(() => {
    const fetchWH = async () => {
      if (!staffTableId) return;
      const { data } = await supabase
        .from('working_hours')
        .select('day_of_week, start_time, end_time, is_active')
        .eq('staff_id', staffTableId);
      if (data) {
        setWorkingHours(data);
        // Pre-select only active working days
        const activeDays = data.filter(wh => wh.is_active).map(wh => wh.day_of_week);
        setSelectedDays(activeDays);
      }
    };
    fetchWH();
  }, [staffTableId]);

  // Get active working day numbers
  const activeDayNumbers = workingHours.filter(wh => wh.is_active).map(wh => wh.day_of_week);

  // Toggle day selection
  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Quick presets
  const selectWeekdays = () => {
    setSelectedDays(activeDayNumbers.filter(d => d >= 1 && d <= 5));
  };
  const selectWeekends = () => {
    setSelectedDays(activeDayNumbers.filter(d => d === 0 || d === 6));
  };
  const selectAll = () => {
    setSelectedDays([...activeDayNumbers]);
  };

  // Generate available time slots from all working days
  const getAvailableTimeSlots = (): string[] => {
    const allSlots = new Set<string>();
    workingHours
      .filter(wh => wh.is_active)
      .forEach(wh => {
        const [startH, startM] = wh.start_time.split(':').map(Number);
        const [endH, endM] = wh.end_time.split(':').map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;
        for (let m = startMin; m < endMin; m += 30) {
          const h = Math.floor(m / 60);
          const min = m % 60;
          allSlots.add(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
      });
    return Array.from(allSlots).sort();
  };

  // Fetch existing recurring-style blocks (grouped by time)
  const fetchExistingBlocks = async () => {
    if (!staffTableId) return;
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('barber_availability')
        .select('id, date, start_time, end_time, is_available')
        .eq('barber_id', staffTableId)
        .eq('is_available', false)
        .gte('date', today)
        .order('date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) { setExistingBlocks([]); return; }

      const grouped: Record<string, { dates: string[]; ids: string[] }> = {};
      data.forEach(b => {
        const time = b.start_time.substring(0, 5);
        if (!grouped[time]) grouped[time] = { dates: [], ids: [] };
        grouped[time].dates.push(b.date);
        grouped[time].ids.push(b.id);
      });

      const blocks: RecurringBlock[] = [];
      Object.entries(grouped).forEach(([time, { dates, ids }]) => {
        if (dates.length < 3) return;
        const sorted = dates.sort();
        blocks.push({
          time,
          startDate: sorted[0],
          endDate: sorted[sorted.length - 1],
          blockIds: ids,
        });
      });

      setExistingBlocks(blocks);
    } catch (err) {
      console.error('Erro ao buscar bloqueios recorrentes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExistingBlocks(); }, [staffTableId]);

  // Create recurring block
  const handleCreateBlock = async () => {
    if (!staffTableId || !selectedTime || !startDate || !endDate) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (selectedDays.length === 0) {
      toast.error('Selecione ao menos um dia da semana');
      return;
    }
    if (endDate < startDate) {
      toast.error('Data final deve ser posterior à data inicial');
      return;
    }

    setSaving(true);
    try {
      const days = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      });

      const workingDays = days.filter(day => {
        const dow = getDay(day);
        // Must be in selected days
        if (!selectedDays.includes(dow)) return false;
        const schedule = workingHours.find(wh => wh.day_of_week === dow && wh.is_active);
        if (!schedule) return false;
        const [sH, sM] = schedule.start_time.split(':').map(Number);
        const [eH, eM] = schedule.end_time.split(':').map(Number);
        const [slotH, slotM] = selectedTime.split(':').map(Number);
        const slotMin = slotH * 60 + slotM;
        return slotMin >= sH * 60 + sM && slotMin < eH * 60 + eM;
      });

      if (workingDays.length === 0) {
        toast.error('Nenhum dia encontrado neste período para este horário e dias selecionados');
        setSaving(false);
        return;
      }

      const [h, m] = selectedTime.split(':').map(Number);
      const totalMin = h * 60 + m + 30;
      const endTimeStr = `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}:00`;

      const datesToBlock = workingDays.map(d => format(d, 'yyyy-MM-dd'));

      const { data: existing } = await supabase
        .from('barber_availability')
        .select('date')
        .eq('barber_id', staffTableId)
        .eq('start_time', `${selectedTime}:00`)
        .eq('is_available', false)
        .in('date', datesToBlock);

      const existingDates = new Set((existing || []).map(e => e.date));
      const newDates = datesToBlock.filter(d => !existingDates.has(d));

      if (newDates.length === 0) {
        toast.info('Todos os dias já estão bloqueados neste horário');
        setSaving(false);
        return;
      }

      const records = newDates.map(date => ({
        barber_id: staffTableId,
        date,
        start_time: `${selectedTime}:00`,
        end_time: endTimeStr,
        is_available: false,
      }));

      const batchSize = 50;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from('barber_availability').insert(batch);
        if (error) throw error;
      }

      toast.success(`${newDates.length} dias bloqueados às ${selectedTime}!`);
      setSelectedTime('');
      await fetchExistingBlocks();
    } catch (error: any) {
      console.error('Erro ao criar bloqueio recorrente:', error);
      toast.error('Erro ao criar bloqueio recorrente');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBlock = async (block: RecurringBlock) => {
    if (!confirm(`Remover bloqueio das ${block.time} de ${format(parseISO(block.startDate), 'dd/MM')} a ${format(parseISO(block.endDate), 'dd/MM')}?`)) return;

    setSaving(true);
    try {
      const batchSize = 50;
      for (let i = 0; i < block.blockIds.length; i += batchSize) {
        const batch = block.blockIds.slice(i, i + batchSize);
        const { error } = await supabase.from('barber_availability').delete().in('id', batch);
        if (error) throw error;
      }
      toast.success(`Bloqueio das ${block.time} removido!`);
      await fetchExistingBlocks();
    } catch (error) {
      console.error('Erro ao remover bloqueio:', error);
      toast.error('Erro ao remover bloqueio');
    } finally {
      setSaving(false);
    }
  };

  const timeSlots = getAvailableTimeSlots();

  // Count how many days will be blocked (preview)
  const getPreviewCount = (): number => {
    if (!selectedTime || !startDate || !endDate || selectedDays.length === 0) return 0;
    try {
      const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
      return days.filter(day => {
        const dow = getDay(day);
        if (!selectedDays.includes(dow)) return false;
        const schedule = workingHours.find(wh => wh.day_of_week === dow && wh.is_active);
        if (!schedule) return false;
        const [sH, sM] = schedule.start_time.split(':').map(Number);
        const [eH, eM] = schedule.end_time.split(':').map(Number);
        const [slotH, slotM] = selectedTime.split(':').map(Number);
        const slotMin = slotH * 60 + slotM;
        return slotMin >= sH * 60 + sM && slotMin < eH * 60 + eM;
      }).length;
    } catch { return 0; }
  };

  if (!staffTableId) {
    return (
      <div className="text-center py-8 text-urbana-light/50">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Dados do barbeiro não encontrados</p>
      </div>
    );
  }

  const previewCount = getPreviewCount();

  return (
    <div className="space-y-4">
      {/* Informativo */}
      <div className="backdrop-blur-sm bg-urbana-gold/5 border border-urbana-gold/20 rounded-xl p-3 sm:p-4">
        <p className="text-[11px] sm:text-sm text-urbana-light/70 leading-relaxed">
          <Repeat className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1.5 sm:mr-2 flex-shrink-0 text-urbana-gold" />
          Bloqueie um horário em vários dias de uma vez. Escolha o horário, o período e os dias da semana desejados.
        </p>
      </div>

      {/* Formulário */}
      <div className="backdrop-blur-sm bg-urbana-black/30 border border-urbana-gold/20 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
        <h3 className="text-sm sm:text-base font-medium text-urbana-light flex items-center gap-2">
          <Plus className="h-4 w-4 text-urbana-gold" />
          Novo Bloqueio Recorrente
        </h3>

        {/* Horário */}
        <div className="space-y-1.5">
          <Label className="text-urbana-light/70 text-xs sm:text-sm flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Horário a Bloquear
          </Label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {timeSlots.map(time => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={cn(
                  'px-2 py-1.5 text-xs rounded-md border transition-colors touch-manipulation',
                  selectedTime === time
                    ? 'bg-urbana-gold/30 border-urbana-gold text-urbana-light font-medium'
                    : 'bg-urbana-black/40 border-urbana-gold/20 text-urbana-light/70 hover:border-urbana-gold/40'
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="space-y-2">
          <Label className="text-urbana-light/70 text-xs sm:text-sm flex items-center gap-1.5">
            <CalendarRange className="h-3.5 w-3.5" />
            Dias da Semana
          </Label>

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={selectAll}
              className={cn(
                'px-2.5 py-1 text-[10px] sm:text-xs rounded-md border transition-colors touch-manipulation',
                selectedDays.length === activeDayNumbers.length
                  ? 'bg-urbana-gold/20 border-urbana-gold/50 text-urbana-light'
                  : 'border-urbana-gold/20 text-urbana-light/60 hover:border-urbana-gold/40'
              )}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={selectWeekdays}
              className={cn(
                'px-2.5 py-1 text-[10px] sm:text-xs rounded-md border transition-colors touch-manipulation',
                'border-urbana-gold/20 text-urbana-light/60 hover:border-urbana-gold/40'
              )}
            >
              Sem Final de Semana
            </button>
            <button
              type="button"
              onClick={selectWeekends}
              className={cn(
                'px-2.5 py-1 text-[10px] sm:text-xs rounded-md border transition-colors touch-manipulation',
                'border-urbana-gold/20 text-urbana-light/60 hover:border-urbana-gold/40'
              )}
            >
              Só Final de Semana
            </button>
          </div>

          {/* Day toggles */}
          <div className="grid grid-cols-7 gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map(day => {
              const isActive = activeDayNumbers.includes(day);
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => isActive && toggleDay(day)}
                  disabled={!isActive}
                  className={cn(
                    'py-2 text-[10px] sm:text-xs rounded-lg border transition-all touch-manipulation font-medium',
                    !isActive && 'opacity-30 cursor-not-allowed border-urbana-gold/10 text-urbana-light/30',
                    isActive && isSelected && 'bg-urbana-gold/25 border-urbana-gold text-urbana-light',
                    isActive && !isSelected && 'bg-urbana-black/40 border-urbana-gold/20 text-urbana-light/50 hover:border-urbana-gold/40'
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Período */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-urbana-light/70 text-xs sm:text-sm flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              Data Início
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-9 text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-urbana-light/70 text-xs sm:text-sm flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" />
              Data Fim
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Preview */}
        {selectedTime && startDate && endDate && (
          <div className="bg-urbana-black/20 border border-urbana-gold/10 rounded-lg p-2.5 sm:p-3 space-y-1">
            <p className="text-[11px] sm:text-xs text-urbana-light/60">
              Horário <span className="text-urbana-gold font-medium">{selectedTime}</span> será bloqueado de{' '}
              <span className="text-urbana-gold font-medium">{format(parseISO(startDate), "dd/MM/yyyy")}</span> até{' '}
              <span className="text-urbana-gold font-medium">{format(parseISO(endDate), "dd/MM/yyyy")}</span>
            </p>
            <p className="text-[11px] sm:text-xs text-urbana-light/50">
              Dias: <span className="text-urbana-light/70">{selectedDays.sort((a,b) => a-b).map(d => DAY_LABELS[d]).join(', ') || 'Nenhum'}</span>
              {previewCount > 0 && (
                <span className="text-urbana-gold font-medium ml-1">• {previewCount} dias serão bloqueados</span>
              )}
            </p>
          </div>
        )}

        <Button
          onClick={handleCreateBlock}
          disabled={saving || !selectedTime || selectedDays.length === 0}
          className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-medium h-10 text-sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Repeat className="h-4 w-4 mr-2" />
          )}
          Bloquear Horário no Período
        </Button>
      </div>

      {/* Bloqueios Existentes */}
      <div className="space-y-2">
        <h3 className="text-sm sm:text-base font-medium text-urbana-light flex items-center gap-2">
          <Clock className="h-4 w-4 text-destructive" />
          Bloqueios Recorrentes Ativos
        </h3>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-urbana-gold" />
          </div>
        ) : existingBlocks.length === 0 ? (
          <div className="backdrop-blur-sm bg-urbana-black/20 border border-urbana-gold/10 rounded-xl p-6 text-center">
            <p className="text-xs sm:text-sm text-urbana-light/50">Nenhum bloqueio recorrente ativo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {existingBlocks.map((block, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-destructive/10 border border-destructive/30 rounded-xl p-3 sm:p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/20 rounded-lg">
                    <Clock className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-destructive">{block.time}</p>
                    <p className="text-[11px] sm:text-xs text-destructive/70">
                      {format(parseISO(block.startDate), 'dd/MM')} → {format(parseISO(block.endDate), 'dd/MM')} • {block.blockIds.length} dias
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBlock(block)}
                  disabled={saving}
                  className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringBlockManager;
