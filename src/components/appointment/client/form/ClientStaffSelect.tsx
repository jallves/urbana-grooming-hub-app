
import React, { useEffect, useState } from 'react';
import { StaffMember } from '@/types/appointment';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';

interface StaffAvailability {
  id: string;
  name: string;
  available: boolean;
}

interface ClientStaffSelectProps {
  staffMembers: StaffMember[];
  form: UseFormReturn<any>;
  selectedDate?: Date;
  selectedTime?: string;
  serviceDuration?: number;
}

const ClientStaffSelect: React.FC<ClientStaffSelectProps> = ({
  staffMembers,
  form,
  selectedDate,
  selectedTime,
  serviceDuration = 60
}) => {
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailability[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkStaffAvailability = async () => {
    if (!selectedDate || !selectedTime || !staffMembers.length) {
      setStaffAvailability(staffMembers.map(staff => ({
        id: staff.id,
        name: staff.name,
        available: true
      })));
      return;
    }

    setIsChecking(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceDuration);

      const availability = await Promise.all(staffMembers.map(async (staff) => {
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', staff.id)
          .eq('status', 'scheduled')
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lte('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          return {
            id: staff.id,
            name: staff.name,
            available: false
          };
        }

        const hasConflict = appointments?.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          return startTime < appEnd && endTime > appStart;
        }) || false;

        return {
          id: staff.id,
          name: staff.name,
          available: !hasConflict
        };
      }));

      setStaffAvailability(availability);
    } catch (error) {
      console.error('Error checking availability:', error);
      setStaffAvailability(staffMembers.map(staff => ({
        id: staff.id,
        name: staff.name,
        available: true
      })));
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStaffAvailability();
  }, [selectedDate, selectedTime, serviceDuration, staffMembers]);

  const availableStaff = staffAvailability.filter(staff => staff.available);
  const unavailableStaff = staffAvailability.filter(staff => !staff.available);

  return (
    <FormField
      control={form.control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">
            Barbeiro
            {isChecking && <span className="ml-2 text-sm text-gray-400">(Verificando disponibilidade...)</span>}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value || ""}
            disabled={isChecking}
          >
            <FormControl>
              <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-stone-800 border-stone-600">
              {availableStaff.map((staff) => (
                <SelectItem key={staff.id} value={staff.id} className="text-white hover:bg-stone-700">
                  {staff.name} ✅ Disponível
                </SelectItem>
              ))}

              {unavailableStaff.map((staff) => (
                <SelectItem
                  key={staff.id}
                  value={staff.id}
                  disabled
                  className="opacity-50 text-white"
                >
                  {staff.name} ❌ Indisponível
                </SelectItem>
              ))}

              {availableStaff.length === 0 && unavailableStaff.length > 0 && (
                <div className="px-2 py-1 text-sm text-red-400">
                  Nenhum barbeiro disponível neste horário
                </div>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ClientStaffSelect;
