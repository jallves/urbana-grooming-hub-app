
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BarberInfo {
  id: string;
  name: string;
  specialties: string;
  image_url: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface DayAvailability {
  date: Date;
  dayName: string;
  slots: TimeSlot[];
}

const BarberAvailabilityChecker: React.FC = () => {
  const [barbers, setBarbers] = useState<BarberInfo[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    loadBarbers();
  }, []);

  useEffect(() => {
    if (selectedBarber) {
      checkAvailability();
    }
  }, [selectedBarber, currentWeek]);

  const loadBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, specialties, image_url')
        .eq('role', 'barber')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading barbers:', error);
        return;
      }

      if (data) {
        setBarbers(data.map(barber => ({
          id: barber.id,
          name: barber.name,
          specialties: barber.specialties || '',
          image_url: barber.image_url || '',
        })));
      }
    } catch (error) {
      console.error('Error loading barbers:', error);
    }
  };

  const checkAvailability = async () => {
    if (!selectedBarber) return;
    
    setLoading(true);
    const weekDays: DayAvailability[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(currentWeek, i);
      const dayName = format(date, 'EEEE', { locale: ptBR });
      
      const slots = await checkDayAvailability(selectedBarber, date);
      weekDays.push({
        date,
        dayName,
        slots
      });
    }

    setAvailability(weekDays);
    setLoading(false);
  };

  const checkDayAvailability = async (barberId: string, date: Date): Promise<TimeSlot[]> => {
    const timeSlots = generateTimeSlots();
    const slots: TimeSlot[] = [];

    for (const time of timeSlots) {
      const isAvailable = await checkTimeSlotAvailability(barberId, date, time);
      slots.push({
        time,
        available: isAvailable,
        reason: isAvailable ? undefined : 'Ocupado'
      });
    }

    return slots;
  };

  const generateTimeSlots = (): string[] => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const checkTimeSlotAvailability = async (barberId: string, date: Date, time: string): Promise<boolean> => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const appointmentTime = new Date(date);
      appointmentTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(appointmentTime);
      endTime.setMinutes(endTime.getMinutes() + 60); // 1 hour slots

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('staff_id', barberId)
        .gte('start_time', appointmentTime.toISOString())
        .lt('start_time', endTime.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        console.error('Error checking availability:', error);
        return false;
      }

      return !appointments || appointments.length === 0;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  };

  const selectedBarberInfo = barbers.find(b => b.id === selectedBarber);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-amber-500" />
            Verificador de Disponibilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Selecionar Barbeiro:</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {barbers.map((barber) => (
                  <Card 
                    key={barber.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedBarber === barber.id ? 'ring-2 ring-amber-500 bg-amber-50' : ''
                    }`}
                    onClick={() => setSelectedBarber(barber.id)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{barber.name}</div>
                        {barber.specialties && (
                          <div className="text-xs text-gray-500 mt-1">{barber.specialties}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {selectedBarberInfo && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Disponibilidade de {selectedBarberInfo.name}</h3>
                  <p className="text-sm text-gray-500">
                    Semana de {format(currentWeek, 'dd/MM', { locale: ptBR })} a {' '}
                    {format(addDays(currentWeek, 6), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                  >
                    Semana Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                  >
                    Próxima Semana
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedBarber && (
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Verificando disponibilidade...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                {availability.map((day, index) => (
                  <div key={index} className="space-y-3">
                    <div className="text-center">
                      <div className="font-medium capitalize">{day.dayName}</div>
                      <div className="text-sm text-gray-500">
                        {format(day.date, 'dd/MM', { locale: ptBR })}
                      </div>
                    </div>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {day.slots.map((slot, slotIndex) => (
                        <Badge
                          key={slotIndex}
                          variant={slot.available ? "default" : "secondary"}
                          className={`w-full justify-center text-xs ${
                            slot.available 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {slot.time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BarberAvailabilityChecker;
