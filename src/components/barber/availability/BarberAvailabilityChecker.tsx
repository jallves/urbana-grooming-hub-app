
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarberWithSlots {
  id: string;
  name: string;
  specialties?: string;
  image_url?: string;
  availableSlots: string[];
}

interface BarberAvailabilityCheckerProps {
  serviceId: string;
  selectedDate: Date;
  onTimeSelect: (barberId: string, time: string) => void;
}

const BarberAvailabilityChecker: React.FC<BarberAvailabilityCheckerProps> = ({
  serviceId,
  selectedDate,
  onTimeSelect
}) => {
  const [barbers, setBarbers] = useState<BarberWithSlots[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!serviceId || !selectedDate) {
        setBarbers([]);
        return;
      }

      setLoading(true);
      try {
        // Buscar duração do serviço
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('duration')
          .eq('id', serviceId)
          .single();

        if (serviceError || !service) {
          console.error('Erro ao buscar serviço:', serviceError);
          return;
        }

        // Buscar barbeiros ativos da tabela barbers
        const { data: activeBarbers, error: barbersError } = await supabase
          .from('barbers')
          .select('id, name, specialties, image_url')
          .eq('is_active', true);

        if (barbersError || !activeBarbers) {
          console.error('Erro ao buscar barbeiros:', barbersError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os barbeiros.",
            variant: "destructive",
          });
          return;
        }

        console.log('Barbeiros encontrados:', activeBarbers);

        // Verificar disponibilidade para cada barbeiro
        const barbersWithAvailability = await Promise.all(
          activeBarbers.map(async (barber) => {
            try {
              const availableSlots = await generateAvailableSlots(
                barber.id,
                selectedDate,
                service.duration
              );

              return {
                id: barber.id,
                name: barber.name,
                specialties: barber.specialties,
                image_url: barber.image_url,
                availableSlots
              };
            } catch (error) {
              console.error(`Erro ao processar barbeiro ${barber.name}:`, error);
              return { 
                id: barber.id,
                name: barber.name,
                specialties: barber.specialties,
                image_url: barber.image_url,
                availableSlots: [] 
              };
            }
          })
        );

        // Filtrar apenas barbeiros com slots disponíveis
        const availableBarbers = barbersWithAvailability.filter(
          barber => barber.availableSlots.length > 0
        );

        setBarbers(availableBarbers);

        if (availableBarbers.length === 0) {
          toast({
            title: "Nenhum barbeiro disponível",
            description: "Não há barbeiros disponíveis para esta data. Tente outra data.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar a disponibilidade dos barbeiros.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [serviceId, selectedDate, toast]);

  const generateAvailableSlots = async (barberId: string, date: Date, duration: number) => {
    const slots = [];
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // Verificar horário de trabalho padrão
    const { data: workingHours } = await supabase
      .from('working_hours')
      .select('start_time, end_time')
      .eq('staff_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (!workingHours) {
      return slots; // Barbeiro não trabalha neste dia
    }

    let startHour = parseInt(workingHours.start_time.split(':')[0]);
    let startMinute = parseInt(workingHours.start_time.split(':')[1]);
    const endHour = parseInt(workingHours.end_time.split(':')[0]);
    const endMinute = parseInt(workingHours.end_time.split(':')[1]);

    // Verificar disponibilidade específica para esta data
    const { data: specificAvailability } = await supabase
      .from('barber_availability')
      .select('*')
      .eq('barber_id', barberId)
      .eq('date', dateStr)
      .single();

    // Se há disponibilidade específica, usar ela ao invés do horário padrão
    if (specificAvailability) {
      if (!specificAvailability.is_available) {
        return slots; // Barbeiro indisponível nesta data
      }
      
      startHour = parseInt(specificAvailability.start_time.split(':')[0]);
      startMinute = parseInt(specificAvailability.start_time.split(':')[1]);
      const specificEndHour = parseInt(specificAvailability.end_time.split(':')[0]);
      const specificEndMinute = parseInt(specificAvailability.end_time.split(':')[1]);
      
      // Usar o horário específico
      const specificEndTime = specificEndHour * 60 + specificEndMinute;
      const startTime = startHour * 60 + startMinute;
      
      for (let currentTime = startTime; currentTime + duration <= specificEndTime; currentTime += 30) {
        const hour = Math.floor(currentTime / 60);
        const minute = currentTime % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        const hasConflict = await checkAppointmentConflict(barberId, slotStart, slotEnd);
        
        if (!hasConflict) {
          slots.push(timeString);
        }
      }
      
      return slots;
    }

    // Usar horário padrão
    const endTime = endHour * 60 + endMinute;
    const startTime = startHour * 60 + startMinute;
    
    for (let currentTime = startTime; currentTime + duration <= endTime; currentTime += 30) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const slotStart = new Date(date);
      slotStart.setHours(hour, minute, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      const hasConflict = await checkAppointmentConflict(barberId, slotStart, slotEnd);
      
      if (!hasConflict) {
        slots.push(timeString);
      }
    }

    return slots;
  };

  const checkAppointmentConflict = async (barberId: string, slotStart: Date, slotEnd: Date) => {
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('staff_id', barberId)
      .gte('start_time', slotStart.toISOString().split('T')[0] + ' 00:00:00')
      .lt('start_time', slotStart.toISOString().split('T')[0] + ' 23:59:59')
      .in('status', ['scheduled', 'confirmed']);

    return existingAppointments?.some(appointment => {
      const appStart = new Date(appointment.start_time);
      const appEnd = new Date(appointment.end_time);
      return slotStart < appEnd && slotEnd > appStart;
    }) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-urbana-gold" />
        <span className="ml-2 text-sm text-muted-foreground">
          Verificando disponibilidade dos barbeiros...
        </span>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <User className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Nenhum barbeiro disponível
            </h3>
            <p className="text-red-600">
              Não há barbeiros disponíveis para a data selecionada. 
              Por favor, escolha outra data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <User className="h-5 w-5 text-urbana-gold" />
        Barbeiros Disponíveis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {barbers.map((barber) => (
          <Card key={barber.id} className="border-urbana-gold/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {barber.image_url ? (
                  <img 
                    src={barber.image_url} 
                    alt={barber.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-urbana-gold/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-urbana-gold/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-urbana-gold" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-base">{barber.name}</CardTitle>
                  {barber.specialties && (
                    <p className="text-sm text-muted-foreground">
                      {barber.specialties}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-urbana-gold" />
                  Horários disponíveis:
                </div>
                <div className="flex flex-wrap gap-2">
                  {barber.availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold hover:text-white transition-colors"
                      onClick={() => onTimeSelect(barber.id, slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BarberAvailabilityChecker;
