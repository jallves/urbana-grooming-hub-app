import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberData } from './useBarberData';
import { toast } from 'sonner';
import { format, isAfter, isBefore, isWithinInterval, parseISO, addDays } from 'date-fns';

export interface TimeOff {
  id: string;
  barber_id: string;
  start_date: string;
  end_date: string;
  type: 'folga' | 'ferias' | 'licenca' | 'feriado' | 'outro';
  reason: string | null;
  status: 'ativo' | 'cancelado';
  created_at: string;
  updated_at: string;
}

export interface CreateTimeOffInput {
  start_date: string;
  end_date: string;
  type: TimeOff['type'];
  reason?: string;
}

export const TIME_OFF_TYPES = {
  folga: { label: 'Folga', color: 'amber', icon: 'coffee' },
  ferias: { label: 'Férias', color: 'blue', icon: 'palmtree' },
  licenca: { label: 'Licença', color: 'purple', icon: 'file-text' },
  feriado: { label: 'Feriado', color: 'green', icon: 'calendar-heart' },
  outro: { label: 'Outro', color: 'gray', icon: 'circle' },
} as const;

export const useTimeOff = () => {
  const { barberData, isLoading: barberLoading } = useBarberData();
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch time offs
  const fetchTimeOffs = useCallback(async () => {
    if (!barberData?.id) {
      setTimeOffs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_off')
        .select('*')
        .eq('barber_id', barberData.id)
        .eq('status', 'ativo')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTimeOffs((data as TimeOff[]) || []);
    } catch (error) {
      console.error('[useTimeOff] Erro ao buscar folgas:', error);
      toast.error('Erro ao carregar folgas');
    } finally {
      setLoading(false);
    }
  }, [barberData?.id]);

  useEffect(() => {
    if (!barberLoading) {
      fetchTimeOffs();
    }
  }, [barberLoading, fetchTimeOffs]);

  // Realtime subscription
  useEffect(() => {
    if (!barberData?.id) return;

    const channel = supabase
      .channel('time-off-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_off',
          filter: `barber_id=eq.${barberData.id}`,
        },
        () => {
          fetchTimeOffs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberData?.id, fetchTimeOffs]);

  // Create time off
  const createTimeOff = async (input: CreateTimeOffInput): Promise<boolean> => {
    if (!barberData?.id) {
      toast.error('Dados do barbeiro não encontrados');
      return false;
    }

    // Validate dates
    const startDate = parseISO(input.start_date);
    const endDate = parseISO(input.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isBefore(startDate, today)) {
      toast.error('A data inicial não pode ser no passado');
      return false;
    }

    if (isBefore(endDate, startDate)) {
      toast.error('A data final deve ser maior ou igual à inicial');
      return false;
    }

    // Check for conflicts with existing time offs
    const hasConflict = timeOffs.some(to => {
      const existingStart = parseISO(to.start_date);
      const existingEnd = parseISO(to.end_date);
      
      return (
        isWithinInterval(startDate, { start: existingStart, end: existingEnd }) ||
        isWithinInterval(endDate, { start: existingStart, end: existingEnd }) ||
        isWithinInterval(existingStart, { start: startDate, end: endDate })
      );
    });

    if (hasConflict) {
      toast.error('Já existe uma ausência registrada neste período');
      return false;
    }

    // Check for existing appointments in the period
    const { data: appointments, error: aptError } = await supabase
      .from('painel_agendamentos')
      .select('id, data, hora')
      .eq('barbeiro_id', barberData.id)
      .gte('data', input.start_date)
      .lte('data', input.end_date)
      .not('status', 'in', '("cancelado","ausente")');

    if (aptError) {
      console.error('[useTimeOff] Erro ao verificar agendamentos:', aptError);
    }

    if (appointments && appointments.length > 0) {
      toast.error(`Existem ${appointments.length} agendamento(s) neste período. Cancele-os primeiro.`);
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('time_off')
        .insert({
          barber_id: barberData.id,
          start_date: input.start_date,
          end_date: input.end_date,
          type: input.type,
          reason: input.reason || null,
          status: 'ativo',
        });

      if (error) throw error;

      toast.success('Ausência registrada com sucesso!');
      await fetchTimeOffs();
      return true;
    } catch (error: any) {
      console.error('[useTimeOff] Erro ao criar folga:', error);
      toast.error(error.message || 'Erro ao registrar ausência');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Cancel time off
  const cancelTimeOff = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('time_off')
        .update({ status: 'cancelado' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Ausência cancelada com sucesso!');
      await fetchTimeOffs();
      return true;
    } catch (error: any) {
      console.error('[useTimeOff] Erro ao cancelar folga:', error);
      toast.error('Erro ao cancelar ausência');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete time off
  const deleteTimeOff = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Ausência removida com sucesso!');
      await fetchTimeOffs();
      return true;
    } catch (error: any) {
      console.error('[useTimeOff] Erro ao deletar folga:', error);
      toast.error('Erro ao remover ausência');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Check if a date is blocked
  const isDateBlocked = useCallback((date: Date): TimeOff | null => {
    return timeOffs.find(to => {
      const startDate = parseISO(to.start_date);
      const endDate = parseISO(to.end_date);
      return isWithinInterval(date, { start: startDate, end: endDate });
    }) || null;
  }, [timeOffs]);

  // Get upcoming time offs
  const upcomingTimeOffs = timeOffs.filter(to => {
    const endDate = parseISO(to.end_date);
    return isAfter(endDate, new Date());
  });

  // Get past time offs
  const pastTimeOffs = timeOffs.filter(to => {
    const endDate = parseISO(to.end_date);
    return isBefore(endDate, new Date());
  });

  // Stats
  const stats = {
    total: timeOffs.length,
    upcoming: upcomingTimeOffs.length,
    totalDays: timeOffs.reduce((acc, to) => {
      const start = parseISO(to.start_date);
      const end = parseISO(to.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return acc + days;
    }, 0),
  };

  return {
    timeOffs,
    upcomingTimeOffs,
    pastTimeOffs,
    loading: loading || barberLoading,
    saving,
    stats,
    createTimeOff,
    cancelTimeOff,
    deleteTimeOff,
    isDateBlocked,
    refetch: fetchTimeOffs,
  };
};
