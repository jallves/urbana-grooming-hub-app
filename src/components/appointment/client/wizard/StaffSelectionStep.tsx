
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Star, Clock } from 'lucide-react';
import { Service } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';

interface Staff {
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

interface StaffSelectionStepProps {
  selectedStaff?: Staff;
  onStaffSelect: (staff: Staff) => void;
  selectedService?: Service;
  selectedDate?: Date;
  selectedTime?: string;
  staff: Staff[];
  loading: boolean;
}

const StaffSelectionStep: React.FC<StaffSelectionStepProps> = ({
  selectedStaff,
  onStaffSelect,
  selectedService,
  selectedDate,
  selectedTime,
  staff,
  loading
}) => {
  const [availableStaffIds, setAvailableStaffIds] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  console.log('[StaffSelectionStep] Renderizando com:', {
    staffCount: staff.length,
    loading,
    selectedStaff: selectedStaff?.name,
    selectedService: selectedService?.name,
    selectedDate,
    selectedTime
  });

  useEffect(() => {
    if (selectedDate && selectedTime && selectedService && staff.length > 0) {
      checkStaffAvailability();
    } else {
      setAvailableStaffIds(staff.map(s => s.id));
    }
  }, [selectedDate, selectedTime, selectedService, staff]);

  const checkStaffAvailability = async () => {
    if (!selectedDate || !selectedTime || !selectedService) return;

    console.log('[StaffSelectionStep] Verificando disponibilidade...');
    setCheckingAvailability(true);
    const available: string[] = [];

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      for (const member of staff) {
        const { data: conflicts, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', member.id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lt('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          console.error('[StaffSelectionStep] Erro ao verificar conflitos para', member.name, ':', error);
          available.push(member.id);
          continue;
        }

        const hasConflict = conflicts?.some(app => {
          const appStart = new Date(app.start_time);
          const appEnd = new Date(app.end_time);
          return startTime < appEnd && endTime > appStart;
        });

        if (!hasConflict) {
          available.push(member.id);
        }
      }

      console.log('[StaffSelectionStep] Staff disponível:', available.length, 'de', staff.length);
      setAvailableStaffIds(available);
    } catch (error) {
      console.error('[StaffSelectionStep] Erro ao verificar disponibilidade:', error);
      setAvailableStaffIds(staff.map(s => s.id));
    } finally {
      setCheckingAvailability(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-700 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-700 rounded w-16"></div>
              <div className="h-4 bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">Escolha seu profissional</h3>
        {checkingAvailability && (
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verificando disponibilidade...</span>
          </div>
        )}
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p>Nenhum profissional disponível no momento.</p>
          <p className="text-sm mt-2">Verifique se há profissionais ativos cadastrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map(member => {
            const isAvailable = availableStaffIds.includes(member.id);
            const isSelected = selectedStaff?.id === member.id;
            return (
              <div
                key={member.id}
                onClick={() => isAvailable && onStaffSelect(member)}
                className={`
                  bg-gray-800 rounded-lg p-6 border-2 transition-all
                  ${isAvailable ? 'cursor-pointer hover:bg-gray-750 hover:border-amber-500/50' : 'opacity-50 cursor-not-allowed'}
                  ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700'}
                `}
              >
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={member.image_url} alt={member.name} />
                    <AvatarFallback className="bg-amber-500 text-black font-semibold">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-white">{member.name}</h4>
                      <div className="flex items-center gap-2">
                        {isSelected && <Badge className="bg-amber-500 text-black">Selecionado</Badge>}
                        {!isAvailable && selectedDate && selectedTime && <Badge variant="destructive">Indisponível</Badge>}
                        {isAvailable && selectedDate && selectedTime && <Badge className="bg-green-600">Disponível</Badge>}
                      </div>
                    </div>
                    {member.specialties && <p className="text-sm text-gray-400 mb-2">{member.specialties}</p>}
                    {member.experience && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm">{member.experience}</span>
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

export default StaffSelectionStep;
