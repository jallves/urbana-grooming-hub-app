
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Clock, AlertCircle } from 'lucide-react';

interface DaySchedule {
  start: string;
  end: string;
  active: boolean;
}

interface WeekSchedule {
  [key: string]: DaySchedule;
}

interface BarberScheduleManagerProps {
  barberId: string;
  barberName?: string;
}

const BarberScheduleManager: React.FC<BarberScheduleManagerProps> = ({ 
  barberId, 
  barberName 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Horário padrão: Segunda a Sábado 08:00-20:00, Domingo 09:00-13:00
  const [schedule, setSchedule] = useState<WeekSchedule>({
    sunday: { start: '09:00', end: '13:00', active: true },
    monday: { start: '08:00', end: '20:00', active: true },
    tuesday: { start: '08:00', end: '20:00', active: true },
    wednesday: { start: '08:00', end: '20:00', active: true },
    thursday: { start: '08:00', end: '20:00', active: true },
    friday: { start: '08:00', end: '20:00', active: true },
    saturday: { start: '08:00', end: '20:00', active: true }
  });

  const dayNames = {
    sunday: 'Domingo',
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado'
  };

  const dayToNumber = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      try {
        const { data: workingHours, error } = await supabase
          .from('working_hours')
          .select('*')
          .eq('staff_id', barberId);

        if (error) {
          console.error('Erro ao carregar horários:', error);
          return;
        }

        if (workingHours && workingHours.length > 0) {
          const newSchedule: WeekSchedule = { ...schedule };
          
          workingHours.forEach((hour) => {
            const dayKey = Object.keys(dayToNumber).find(
              key => dayToNumber[key as keyof typeof dayToNumber] === hour.day_of_week
            ) as keyof WeekSchedule;
            
            if (dayKey) {
              newSchedule[dayKey] = {
                start: hour.start_time,
                end: hour.end_time,
                active: hour.is_active
              };
            }
          });
          
          setSchedule(newSchedule);
        } else {
          // Se não há horários, usar o padrão e salvar automaticamente
          await saveDefaultSchedule();
        }
      } catch (error) {
        console.error('Erro ao carregar horários:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os horários.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (barberId) {
      loadSchedule();
    }
  }, [barberId]);

  const saveDefaultSchedule = async () => {
    try {
      // Converter para formato do banco de dados
      const workingHours = Object.entries(schedule)
        .filter(([, config]) => config.active)
        .map(([day, config]) => ({
          staff_id: barberId,
          day_of_week: dayToNumber[day as keyof typeof dayToNumber],
          start_time: config.start,
          end_time: config.end,
          is_active: config.active
        }));

      if (workingHours.length > 0) {
        const { error } = await supabase
          .from('working_hours')
          .insert(workingHours);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Erro ao salvar horário padrão:', error);
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      // Primeiro deletar horários existentes
      await supabase
        .from('working_hours')
        .delete()
        .eq('staff_id', barberId);

      // Converter para formato do banco de dados
      const workingHours = Object.entries(schedule)
        .filter(([, config]) => config.active)
        .map(([day, config]) => ({
          staff_id: barberId,
          day_of_week: dayToNumber[day as keyof typeof dayToNumber],
          start_time: config.start,
          end_time: config.end,
          is_active: config.active
        }));

      if (workingHours.length > 0) {
        const { error } = await supabase
          .from('working_hours')
          .insert(workingHours);

        if (error) throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Horários atualizados com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar horários. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const resetToDefault = () => {
    setSchedule({
      sunday: { start: '09:00', end: '13:00', active: true },
      monday: { start: '08:00', end: '20:00', active: true },
      tuesday: { start: '08:00', end: '20:00', active: true },
      wednesday: { start: '08:00', end: '20:00', active: true },
      thursday: { start: '08:00', end: '20:00', active: true },
      friday: { start: '08:00', end: '20:00', active: true },
      saturday: { start: '08:00', end: '20:00', active: true }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Carregando horários...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-urbana-gold" />
          Gerenciar Horários
          {barberName && <span className="text-muted-foreground">- {barberName}</span>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Horário Padrão Configurado</p>
              <p>
                Segunda a Sábado: 08:00 às 20:00 | Domingo: 09:00 às 13:00
              </p>
              <p className="mt-1 text-xs">
                Você pode ajustar os horários conforme necessário para cada barbeiro.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={resetToDefault} 
            variant="outline"
            className="border-urbana-gold text-urbana-gold hover:bg-urbana-gold hover:text-urbana-black"
          >
            Restaurar Padrão
          </Button>
        </div>

        <div className="space-y-4">
          {Object.entries(schedule).map(([day, config]) => (
            <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-32">
                <label className="font-medium">
                  {dayNames[day as keyof typeof dayNames]}
                </label>
              </div>
              
              <Switch
                checked={config.active}
                onCheckedChange={(checked) => updateSchedule(day, 'active', checked)}
              />
              
              {config.active && (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Das:</label>
                    <Input
                      type="time"
                      value={config.start}
                      onChange={(e) => updateSchedule(day, 'start', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Até:</label>
                    <Input
                      type="time"
                      value={config.end}
                      onChange={(e) => updateSchedule(day, 'end', e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <Button 
          onClick={saveSchedule} 
          disabled={saving}
          className="w-full bg-urbana-gold hover:bg-urbana-gold/90"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BarberScheduleManager;
