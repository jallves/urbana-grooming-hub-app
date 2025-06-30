import React, { useEffect, useState } from 'react';
import { StaffMember } from '@/types/appointment';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StaffAvailability {
  id: string;
  name: string;
  available: boolean;
}

interface StaffSelectProps {
  staffMembers: StaffMember[];
  form: UseFormReturn<any>;
  selectedDate?: Date;
  selectedTime?: string;
  serviceDuration?: number;
  appointmentId?: string;
}

const StaffSelect: React.FC<StaffSelectProps> = ({
  staffMembers,
  form,
  selectedDate,
  selectedTime,
  serviceDuration = 60,
  appointmentId
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
        let query = supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', staff.id)
          .eq('status', 'scheduled')
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lte('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (appointmentId) {
          query = query.neq('id', appointmentId);
        }

        const { data: appointments, error } = await query;

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

      // Ajuste automático se barbeiro indisponível
      const currentStaffId = form.getValues('staff_id');
      if (currentStaffId) {
        const currentStaffAvailable = availability.find(s => s.id === currentStaffId)?.available;
        if (!currentStaffAvailable) {
          const firstAvailable = availability.find(s => s.available);
          if (firstAvailable) {
            form.setValue('staff_id', firstAvailable.id);
            toast({
              title: "Barbeiro não disponível",
              description: `O barbeiro selecionado não está disponível neste horário. Selecionamos ${firstAvailable.name} automaticamente.`,
            });
          } else {
            form.setValue('staff_id', '');
            toast({
              title: "Nenhum barbeiro disponível",
              description: "Não há barbeiros disponíveis para o horário selecionado. Por favor, escolha outro horário.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível verificar a disponibilidade dos barbeiros.",
        variant: "destructive",
      });
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
  }, [selectedDate, selectedTime, serviceDuration, staffMembers, appointmentId]);

  const availableStaff = staffAvailability.filter(staff => staff.available);
  const unavailableStaff = staffAvailability.filter(staff => !staff.available);

  return (
    <FormField
      control={form.control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-black">
            Barbeiro
            {isChecking && <span className="ml-2 text-sm text-gray-500">(Verificando disponibilidade...)</span>}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value || ""}
            disabled={isChecking}
          >
            <FormControl>
              <SelectTrigger className="text-black">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableStaff.map((staff) => (
                <SelectItem key={staff.id} value={staff.id} className="text-black">
                  {staff.name} ✅ Disponível
                </SelectItem>
              ))}

              {unavailableStaff.map((staff) => (
                <SelectItem
                  key={staff.id}
                  value={staff.id}
                  disabled
                  className="opacity-50 text-black"
                >
                  {staff.name} ❌ Indisponível
                </SelectItem>
              ))}

              {availableStaff.length === 0 && unavailableStaff.length > 0 && (
                <div className="px-2 py-1 text-sm text-red-600">
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

export default StaffSelect;
