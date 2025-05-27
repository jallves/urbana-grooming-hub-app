
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
  appointmentId?: string; // Para excluir o próprio agendamento ao editar
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
    if (!selectedDate || !selectedTime) {
      // Se não há data/hora selecionada, todos ficam disponíveis
      setStaffAvailability(staffMembers.map(staff => ({
        id: staff.id,
        name: staff.name,
        available: true
      })));
      return;
    }

    setIsChecking(true);

    try {
      // Criar horário de início e fim do agendamento
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceDuration);

      const startISOString = startTime.toISOString();
      const endISOString = endTime.toISOString();

      // Verificar disponibilidade para cada barbeiro
      const availability = await Promise.all(staffMembers.map(async (staff) => {
        let query = supabase
          .from('appointments')
          .select('id')
          .eq('staff_id', staff.id)
          .eq('status', 'scheduled')
          .or(`start_time.lt.${endISOString},end_time.gt.${startISOString}`);

        // Se estamos editando um agendamento, excluí-lo da verificação
        if (appointmentId) {
          query = query.neq('id', appointmentId);
        }

        const { data: overlappingAppointments, error } = await query;

        if (error) {
          console.error('Erro ao verificar disponibilidade:', error);
          return {
            id: staff.id,
            name: staff.name,
            available: false
          };
        }

        const isAvailable = !overlappingAppointments || overlappingAppointments.length === 0;
        
        return {
          id: staff.id,
          name: staff.name,
          available: isAvailable
        };
      }));

      setStaffAvailability(availability);

      // Verificar se o barbeiro selecionado ainda está disponível
      const currentStaffId = form.getValues('staff_id');
      if (currentStaffId) {
        const currentStaffAvailable = availability.find(s => s.id === currentStaffId)?.available;
        if (!currentStaffAvailable) {
          // Encontrar primeiro barbeiro disponível
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
      console.error('Erro ao verificar disponibilidade dos barbeiros:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a disponibilidade dos barbeiros.",
        variant: "destructive",
      });
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
          <FormLabel>
            Barbeiro
            {isChecking && <span className="ml-2 text-sm text-gray-500">(Verificando disponibilidade...)</span>}
          </FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value || ""}
            disabled={isChecking}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {/* Barbeiros disponíveis */}
              {availableStaff.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name} ✅
                </SelectItem>
              ))}
              
              {/* Barbeiros indisponíveis (desabilitados) */}
              {unavailableStaff.map((staff) => (
                <SelectItem 
                  key={staff.id} 
                  value={staff.id} 
                  disabled
                  className="opacity-50"
                >
                  {staff.name} ❌ (Indisponível)
                </SelectItem>
              ))}
              
              {/* Mensagem quando não há barbeiros disponíveis */}
              {availableStaff.length === 0 && selectedDate && selectedTime && (
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
