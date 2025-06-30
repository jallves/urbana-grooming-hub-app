
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Star, Clock } from 'lucide-react';
import { Service } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';

interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  image_url: string;
  specialties: string;
  experience: string;
  role: string;
  is_active: boolean;
}

interface BarberSelectionStepProps {
  selectedBarber?: Barber;
  onBarberSelect: (barber: Barber) => void;
  selectedService?: Service;
  selectedDate?: Date;
  selectedTime?: string;
  barbers: Barber[];
  loading: boolean;
}

const BarberSelectionStep: React.FC<BarberSelectionStepProps> = ({
  selectedBarber,
  onBarberSelect,
  selectedService,
  selectedDate,
  selectedTime,
  barbers,
  loading
}) => {
  const [availableBarbers, setAvailableBarbers] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  console.log('[BarberSelectionStep] Props recebidas:', {
    barbersCount: barbers.length,
    loading,
    selectedService: selectedService?.name,
    selectedDate,
    selectedTime,
    barbers: barbers.map(b => ({ id: b.id, name: b.name, is_active: b.is_active }))
  });

  useEffect(() => {
    console.log('[BarberSelectionStep] useEffect disparado:', {
      hasSelectedDate: !!selectedDate,
      hasSelectedTime: !!selectedTime,
      hasSelectedService: !!selectedService,
      barbersCount: barbers.length
    });

    if (selectedDate && selectedTime && selectedService && barbers.length > 0) {
      console.log('[BarberSelectionStep] Verificando disponibilidade dos barbeiros...');
      checkBarbersAvailability();
    } else {
      console.log('[BarberSelectionStep] Mostrando todos os barbeiros como disponíveis');
      setAvailableBarbers(barbers.map(b => b.id));
    }
  }, [selectedDate, selectedTime, selectedService, barbers]);

  const checkBarbersAvailability = async () => {
    if (!selectedDate || !selectedTime || !selectedService) {
      console.log('[BarberSelectionStep] Parâmetros faltando para verificação');
      return;
    }

    console.log('[BarberSelectionStep] Iniciando verificação de disponibilidade...');
    setCheckingAvailability(true);
    const available: string[] = [];

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      console.log('[BarberSelectionStep] Verificando período:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: selectedService.duration
      });

      for (const barber of barbers) {
        console.log(`[BarberSelectionStep] Verificando barbeiro: ${barber.name}`);
        
        const { data: conflicts, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', barber.id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lt('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          console.error(`[BarberSelectionStep] Erro verificando ${barber.name}:`, error);
          available.push(barber.id);
          continue;
        }

        console.log(`[BarberSelectionStep] Conflitos encontrados para ${barber.name}:`, conflicts?.length || 0);

        const hasConflict = conflicts?.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          const overlap = startTime < appEnd && endTime > appStart;
          
          if (overlap) {
            console.log(`[BarberSelectionStep] Conflito encontrado para ${barber.name}:`, {
              appointmentStart: appStart.toISOString(),
              appointmentEnd: appEnd.toISOString(),
              requestedStart: startTime.toISOString(),
              requestedEnd: endTime.toISOString()
            });
          }
          
          return overlap;
        }) || false;

        if (!hasConflict) {
          available.push(barber.id);
          console.log(`[BarberSelectionStep] ${barber.name} está disponível`);
        } else {
          console.log(`[BarberSelectionStep] ${barber.name} não está disponível (conflito)`);
        }
      }

      console.log('[BarberSelectionStep] Resultado da verificação:', {
        totalBarbers: barbers.length,
        availableBarbers: available.length,
        availableIds: available
      });

      setAvailableBarbers(available);
    } catch (error) {
      console.error('[BarberSelectionStep] Erro na verificação:', error);
      setAvailableBarbers(barbers.map(b => b.id));
    } finally {
      setCheckingAvailability(false);
    }
  };

  if (loading) {
    console.log('[BarberSelectionStep] Renderizando estado de loading...');
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  console.log('[BarberSelectionStep] Renderizando barbeiros:', {
    barbersCount: barbers.length,
    availableBarbersCount: availableBarbers.length
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">
          Escolha seu barbeiro
        </h3>
        {checkingAvailability && (
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verificando disponibilidade...</span>
          </div>
        )}
      </div>

      {barbers.length === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum barbeiro disponível no momento.</p>
          <p className="text-gray-500 text-sm mt-2">
            Verifique se há barbeiros cadastrados e ativos no sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {barbers.map((barber) => {
            const isAvailable = availableBarbers.includes(barber.id);
            const isSelected = selectedBarber?.id === barber.id;
            
            console.log(`[BarberSelectionStep] Renderizando barbeiro ${barber.name}:`, {
              isAvailable,
              isSelected,
              barberId: barber.id
            });
            
            return (
              <div
                key={barber.id}
                onClick={() => {
                  console.log(`[BarberSelectionStep] Barbeiro selecionado: ${barber.name}`);
                  if (isAvailable) {
                    onBarberSelect(barber);
                  }
                }}
                className={`
                  bg-gray-800 rounded-lg p-6 transition-all border-2
                  ${isAvailable 
                    ? 'cursor-pointer hover:bg-gray-750 hover:border-amber-500/50' 
                    : 'opacity-50 cursor-not-allowed'
                  }
                  ${isSelected 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-gray-700'
                  }
                `}
              >
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={barber.image_url} alt={barber.name} />
                    <AvatarFallback className="bg-amber-500 text-black font-semibold">
                      {barber.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-white">
                        {barber.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Badge className="bg-amber-500 text-black">
                            Selecionado
                          </Badge>
                        )}
                        {!isAvailable && selectedDate && selectedTime && (
                          <Badge variant="destructive">
                            Indisponível
                          </Badge>
                        )}
                        {isAvailable && selectedDate && selectedTime && (
                          <Badge className="bg-green-600">
                            Disponível
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {barber.specialties && (
                      <p className="text-sm text-gray-400 mb-2">
                        {barber.specialties}
                      </p>
                    )}
                    
                    {barber.experience && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm">{barber.experience}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BarberSelectionStep;
