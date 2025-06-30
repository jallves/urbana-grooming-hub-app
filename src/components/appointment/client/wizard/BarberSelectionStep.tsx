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
  staffList: Staff[];
  loading: boolean;
}

const StaffSelectionStep: React.FC<StaffSelectionStepProps> = ({
  selectedStaff,
  onStaffSelect,
  selectedService,
  selectedDate,
  selectedTime,
  staffList,
  loading
}) => {
  const [availableStaff, setAvailableStaff] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (selectedDate && selectedTime && selectedService && staffList.length > 0) {
      checkStaffAvailability();
    } else {
      setAvailableStaff(staffList.map(b => b.id));
    }
  }, [selectedDate, selectedTime, selectedService, staffList]);

  const checkStaffAvailability = async () => {
    if (!selectedDate || !selectedTime || !selectedService) return;

    setCheckingAvailability(true);
    const available: string[] = [];

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration);

      for (const staff of staffList) {
        const { data: conflicts, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', staff.id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lt('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          available.push(staff.id);
          continue;
        }

        const hasConflict = conflicts?.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          return startTime < appEnd && endTime > appStart;
        }) || false;

        if (!hasConflict) {
          available.push(staff.id);
        }
      }

      setAvailableStaff(available);
    } catch (error) {
      setAvailableStaff(staffList.map(b => b.id));
    } finally {
      setCheckingAvailability(false);
    }
  };

  if (loading) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">
          Escolha seu profissional
        </h3>
        {checkingAvailability && (
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verificando disponibilidade...</span>
          </div>
        )}
      </div>

      {staffList.length === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum profissional disponível no momento.</p>
          <p className="text-gray-500 text-sm mt-2">
            Verifique se há profissionais cadastrados e ativos no sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staffList.map((staff) => {
            const isAvailable = availableStaff.includes(staff.id);
            const isSelected = selectedStaff?.id === staff.id;

            return (
              <div
                key={staff.id}
                onClick={() => {
                  if (isAvailable) {
                    onStaffSelect(staff);
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
                    <AvatarImage src={staff.image_url} alt={staff.name} />
                    <AvatarFallback className="bg-amber-500 text-black font-semibold">
                      {staff.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-white">
                        {staff.name}
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

                    {staff.specialties && (
                      <p className="text-sm text-gray-400 mb-2">
                        {staff.specialties}
                      </p>
                    )}

                    {staff.experience && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm">{staff.experience}</span>
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
