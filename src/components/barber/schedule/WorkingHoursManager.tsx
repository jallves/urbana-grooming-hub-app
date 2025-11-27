import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberData } from '@/hooks/barber/useBarberData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Clock, Sun, Moon, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { 
  PainelBarbeiroCard,
  PainelBarbeiroCardHeader,
  PainelBarbeiroCardTitle,
  PainelBarbeiroCardContent
} from '@/components/barber/PainelBarbeiroCard';

interface WorkingHour {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', shortLabel: 'Dom', icon: Sun },
  { value: 1, label: 'Segunda-feira', shortLabel: 'Seg', icon: Calendar },
  { value: 2, label: 'Terça-feira', shortLabel: 'Ter', icon: Calendar },
  { value: 3, label: 'Quarta-feira', shortLabel: 'Qua', icon: Calendar },
  { value: 4, label: 'Quinta-feira', shortLabel: 'Qui', icon: Calendar },
  { value: 5, label: 'Sexta-feira', shortLabel: 'Sex', icon: Calendar },
  { value: 6, label: 'Sábado', shortLabel: 'Sáb', icon: Moon },
];

const WorkingHoursManager: React.FC = () => {
  const { barberData } = useBarberData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);

  useEffect(() => {
    if (barberData?.staff_id) {
      fetchWorkingHours();
    }
  }, [barberData?.staff_id]);

  const fetchWorkingHours = async () => {
    if (!barberData?.staff_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('staff_id', barberData.staff_id)
        .order('day_of_week');

      if (error) throw error;

      if (!data || data.length === 0) {
        const defaultHours: WorkingHour[] = DAYS_OF_WEEK.map(day => ({
          day_of_week: day.value,
          start_time: '08:00',
          end_time: '18:00',
          is_active: day.value >= 1 && day.value <= 6,
        }));
        setWorkingHours(defaultHours);
      } else {
        const allDays = DAYS_OF_WEEK.map(day => {
          const existing = data.find(d => d.day_of_week === day.value);
          if (existing) {
            return {
              id: existing.id,
              day_of_week: existing.day_of_week,
              start_time: existing.start_time,
              end_time: existing.end_time,
              is_active: existing.is_active,
            };
          }
          return {
            day_of_week: day.value,
            start_time: '08:00',
            end_time: '18:00',
            is_active: false,
          };
        });
        setWorkingHours(allDays);
      }
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      toast.error('Erro ao carregar horários de trabalho');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (dayOfWeek: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours(prev => 
      prev.map(hour => 
        hour.day_of_week === dayOfWeek 
          ? { ...hour, [field]: value }
          : hour
      )
    );
  };

  const handleSave = async () => {
    if (!barberData?.staff_id) {
      toast.error('Dados do barbeiro não encontrados');
      return;
    }

    setSaving(true);
    try {
      await supabase
        .from('working_hours')
        .delete()
        .eq('staff_id', barberData.staff_id);

      const activeHours = workingHours.filter(h => h.is_active);
      
      if (activeHours.length === 0) {
        toast.warning('Atenção', {
          description: 'Você não tem nenhum dia de trabalho ativo.',
        });
        return;
      }

      const { error } = await supabase
        .from('working_hours')
        .insert(
          activeHours.map(hour => ({
            staff_id: barberData.staff_id,
            day_of_week: hour.day_of_week,
            start_time: hour.start_time,
            end_time: hour.end_time,
            is_active: true,
          }))
        );

      if (error) throw error;

      toast.success('Horários salvos!', {
        description: 'Seus horários foram atualizados com sucesso',
      });
      
      fetchWorkingHours();
    } catch (error: any) {
      console.error('Erro ao salvar horários:', error);
      toast.error('Erro ao salvar horários', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const activeDays = workingHours.filter(h => h.is_active).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header informativo */}
      <PainelBarbeiroCard variant="info" className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-urbana-light mb-1">
              Configure seus horários de trabalho
            </h3>
            <p className="text-xs text-urbana-light/70 leading-relaxed">
              Defina os dias e horários em que você está disponível para atendimentos. 
              Clientes só poderão agendar nos dias ativos.
            </p>
          </div>
        </div>
      </PainelBarbeiroCard>

      {/* Resumo */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeDays > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-urbana-light/70">
            {activeDays} {activeDays === 1 ? 'dia ativo' : 'dias ativos'}
          </span>
        </div>
      </div>

      {/* Lista de dias */}
      <div className="space-y-2">
        {workingHours.map((hour) => {
          const dayInfo = DAYS_OF_WEEK.find(d => d.value === hour.day_of_week);
          const DayIcon = dayInfo?.icon || Calendar;
          
          return (
            <PainelBarbeiroCard
              key={hour.day_of_week}
              variant={hour.is_active ? 'highlight' : 'default'}
              className={`transition-all duration-200 ${
                !hour.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="p-3 sm:p-4">
                {/* Header do dia */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${
                      hour.is_active 
                        ? 'bg-urbana-gold/20' 
                        : 'bg-urbana-black/30'
                    }`}>
                      <DayIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        hour.is_active ? 'text-urbana-gold' : 'text-urbana-light/50'
                      }`} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm sm:text-base font-semibold ${
                        hour.is_active ? 'text-urbana-light' : 'text-urbana-light/50'
                      }`}>
                        {dayInfo?.label}
                      </span>
                      <span className="text-[10px] sm:text-xs text-urbana-light/50">
                        {hour.is_active ? 'Disponível para agendamentos' : 'Indisponível'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hour.is_active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 hidden sm:block" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400/50 hidden sm:block" />
                    )}
                    <Switch
                      checked={hour.is_active}
                      onCheckedChange={(checked) => 
                        handleUpdate(hour.day_of_week, 'is_active', checked)
                      }
                      className="data-[state=checked]:bg-urbana-gold"
                    />
                  </div>
                </div>

                {/* Inputs de horário - só mostra se ativo */}
                {hour.is_active && (
                  <div className="flex items-center gap-2 sm:gap-4 pt-2 border-t border-urbana-gold/10">
                    {/* Horário de início */}
                    <div className="flex-1">
                      <label className="text-[10px] sm:text-xs text-urbana-light/60 mb-1 block">
                        Início
                      </label>
                      <div className="relative">
                        <Sun className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400/70 pointer-events-none" />
                        <Input
                          type="time"
                          value={hour.start_time}
                          onChange={(e) => 
                            handleUpdate(hour.day_of_week, 'start_time', e.target.value)
                          }
                          className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-10 sm:h-11 text-sm sm:text-base pl-8 sm:pl-10 pr-2 w-full font-mono"
                        />
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="flex flex-col items-center justify-end pb-1">
                      <span className="text-xs sm:text-sm text-urbana-light/40 font-medium">
                        até
                      </span>
                    </div>

                    {/* Horário de fim */}
                    <div className="flex-1">
                      <label className="text-[10px] sm:text-xs text-urbana-light/60 mb-1 block">
                        Fim
                      </label>
                      <div className="relative">
                        <Moon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400/70 pointer-events-none" />
                        <Input
                          type="time"
                          value={hour.end_time}
                          onChange={(e) => 
                            handleUpdate(hour.day_of_week, 'end_time', e.target.value)
                          }
                          className="bg-urbana-black/40 border-urbana-gold/20 text-urbana-light h-10 sm:h-11 text-sm sm:text-base pl-8 sm:pl-10 pr-2 w-full font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </PainelBarbeiroCard>
          );
        })}
      </div>

      {/* Botão de salvar */}
      <div className="pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90 h-12 text-sm sm:text-base font-semibold shadow-lg shadow-urbana-gold/20"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Salvar Horários
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default WorkingHoursManager;
