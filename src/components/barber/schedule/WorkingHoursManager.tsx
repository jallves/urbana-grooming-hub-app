import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBarberData } from '@/hooks/barber/useBarberData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Clock } from 'lucide-react';

interface WorkingHour {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
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

      // Se não houver horários, criar estrutura padrão
      if (!data || data.length === 0) {
        const defaultHours: WorkingHour[] = DAYS_OF_WEEK.map(day => ({
          day_of_week: day.value,
          start_time: '08:00',
          end_time: '18:00',
          is_active: day.value >= 1 && day.value <= 6, // Segunda a Sábado ativos por padrão
        }));
        setWorkingHours(defaultHours);
      } else {
        // Garantir que todos os dias estão presentes
        const existingDays = data.map(d => d.day_of_week);
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
      // Deletar horários existentes
      await supabase
        .from('working_hours')
        .delete()
        .eq('staff_id', barberData.staff_id);

      // Inserir apenas os horários ativos
      const activeHours = workingHours.filter(h => h.is_active);
      
      if (activeHours.length === 0) {
        toast.warning('⚠️ Atenção', {
          description: 'Você não tem nenhum dia de trabalho ativo. Clientes não poderão agendar com você.',
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

      toast.success('✅ Horários salvos!', {
        description: 'Seus horários de trabalho foram atualizados com sucesso',
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <Clock className="h-4 w-4 inline mr-2" />
          Configure seus horários de trabalho para cada dia da semana. 
          Apenas os dias ativos aparecerão para agendamento.
        </p>
      </div>

      <div className="space-y-4">
        {workingHours.map((hour) => {
          const dayInfo = DAYS_OF_WEEK.find(d => d.value === hour.day_of_week);
          
          return (
            <div
              key={hour.day_of_week}
              className={`p-4 rounded-lg border transition-all ${
                hour.is_active
                  ? 'bg-gray-700/30 border-urbana-gold/30'
                  : 'bg-gray-800/30 border-gray-700/50 opacity-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 min-w-[180px]">
                  <Switch
                    checked={hour.is_active}
                    onCheckedChange={(checked) => 
                      handleUpdate(hour.day_of_week, 'is_active', checked)
                    }
                    className="data-[state=checked]:bg-urbana-gold"
                  />
                  <Label className="text-white font-medium cursor-pointer">
                    {dayInfo?.label}
                  </Label>
                </div>

                {hour.is_active && (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <Label className="text-gray-400 text-xs mb-1">Início</Label>
                      <Input
                        type="time"
                        value={hour.start_time}
                        onChange={(e) => 
                          handleUpdate(hour.day_of_week, 'start_time', e.target.value)
                        }
                        className="bg-gray-700/50 border-gray-600 text-white"
                      />
                    </div>
                    <span className="text-gray-400 mt-5">até</span>
                    <div className="flex-1">
                      <Label className="text-gray-400 text-xs mb-1">Fim</Label>
                      <Input
                        type="time"
                        value={hour.end_time}
                        onChange={(e) => 
                          handleUpdate(hour.day_of_week, 'end_time', e.target.value)
                        }
                        className="bg-gray-700/50 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-urbana-gold text-black hover:bg-urbana-gold/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Horários
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default WorkingHoursManager;
