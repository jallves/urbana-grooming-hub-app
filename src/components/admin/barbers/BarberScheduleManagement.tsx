
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, Settings } from 'lucide-react';
import BarberScheduleManager from '@/components/barber/schedule/BarberScheduleManager';

interface Barber {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

const BarberScheduleManagement: React.FC = () => {
  const { toast } = useToast();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBarbers(data || []);
      
      // Auto-select first barber if available
      if (data && data.length > 0) {
        setSelectedBarberId(data[0].id);
        setSelectedBarber(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de barbeiros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarberSelect = (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    setSelectedBarberId(barberId);
    setSelectedBarber(barber || null);
  };

  const setupDefaultScheduleForAll = async () => {
    try {
      const promises = barbers.map(async (barber) => {
        // Check if barber already has schedule
        const { data: existing } = await supabase
          .from('working_hours')
          .select('id')
          .eq('staff_id', barber.id)
          .limit(1);

        if (!existing || existing.length === 0) {
          // Create default schedule
          const defaultSchedule = [
            { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_active: true },
            { day_of_week: 2, start_time: '09:00', end_time: '18:00', is_active: true },
            { day_of_week: 3, start_time: '09:00', end_time: '18:00', is_active: true },
            { day_of_week: 4, start_time: '09:00', end_time: '18:00', is_active: true },
            { day_of_week: 5, start_time: '09:00', end_time: '18:00', is_active: true },
            { day_of_week: 6, start_time: '09:00', end_time: '14:00', is_active: true },
          ];

          const workingHours = defaultSchedule.map(schedule => ({
            staff_id: barber.id,
            ...schedule
          }));

          const { error } = await supabase
            .from('working_hours')
            .insert(workingHours);

          if (error) throw error;
        }
      });

      await Promise.all(promises);
      
      toast({
        title: "Sucesso",
        description: "Horários padrão configurados para todos os barbeiros.",
      });
    } catch (error) {
      console.error('Erro ao configurar horários padrão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível configurar os horários padrão.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Carregando barbeiros...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-urbana-gold" />
            Gerenciamento de Horários dos Barbeiros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Selecionar Barbeiro:
              </label>
              <Select value={selectedBarberId} onValueChange={handleBarberSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {barber.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={setupDefaultScheduleForAll}
                variant="outline"
                className="border-urbana-gold text-urbana-gold hover:bg-urbana-gold hover:text-urbana-black"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurar Padrão para Todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBarber && (
        <BarberScheduleManager 
          barberId={selectedBarberId} 
          barberName={selectedBarber.name}
        />
      )}
    </div>
  );
};

export default BarberScheduleManagement;
