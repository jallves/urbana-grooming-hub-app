
import React, { useEffect, useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Tipo simplificado para Staff Member compatível com a tabela staff
interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  image_url?: string;
  specialties?: string;
  experience?: string;
}

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

  console.log('🔍 ClientStaffSelect - Props recebidas:', {
    staffMembersCount: staffMembers?.length || 0,
    staffMembers: staffMembers,
    selectedDate,
    selectedTime,
    serviceDuration
  });

  const checkStaffAvailability = async () => {
    console.log('🔍 Cliente: Verificando disponibilidade dos barbeiros...');
    
    // Se não há barbeiros, não fazer nada
    if (!staffMembers || staffMembers.length === 0) {
      console.log('⚠️ Nenhum barbeiro disponível para verificar');
      setStaffAvailability([]);
      return;
    }

    // Se não há data ou horário selecionado, mostrar todos como disponíveis
    if (!selectedDate || !selectedTime) {
      console.log('📅 Sem data/horário - mostrando todos barbeiros como disponíveis');
      setStaffAvailability(staffMembers.map(staff => ({
        id: staff.id,
        name: staff.name,
        available: true
      })));
      return;
    }

    setIsChecking(true);
    console.log('🔍 Verificando disponibilidade dos barbeiros...');

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceDuration);

      console.log(`📅 Horário solicitado: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`);

      const availability = await Promise.all(staffMembers.map(async (staff) => {
        console.log(`👤 Verificando barbeiro: ${staff.name} (ID: ${staff.id})`);
        
        // Buscar agendamentos usando o staff_id
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, status')
          .eq('staff_id', staff.id)
          .eq('status', 'scheduled')
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lte('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          console.error('❌ Erro ao verificar disponibilidade:', error);
          return {
            id: staff.id,
            name: staff.name,
            available: false
          };
        }

        const hasConflict = appointments?.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          const overlap = startTime < appEnd && endTime > appStart;
          
          if (overlap) {
            console.log(`⚠️ Conflito para ${staff.name}: ${appStart.toLocaleTimeString()} - ${appEnd.toLocaleTimeString()}`);
          }
          
          return overlap;
        }) || false;

        const available = !hasConflict;
        console.log(`${available ? '✅' : '❌'} ${staff.name}: ${available ? 'Disponível' : 'Indisponível'}`);

        return {
          id: staff.id,
          name: staff.name,
          available
        };
      }));

      setStaffAvailability(availability);

      // Auto-select first available staff if current is unavailable
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
      console.error('❌ Erro geral na verificação:', error);
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
  }, [selectedDate, selectedTime, serviceDuration, staffMembers]);

  const availableStaff = staffAvailability.filter(staff => staff.available);
  const unavailableStaff = staffAvailability.filter(staff => !staff.available);

  console.log('📊 Resultado final:', {
    totalStaff: staffMembers.length,
    availableCount: availableStaff.length,
    unavailableCount: unavailableStaff.length,
    availableStaff,
    unavailableStaff
  });

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
                <SelectValue placeholder={
                  staffMembers.length === 0 
                    ? "Carregando barbeiros..." 
                    : "Selecione um barbeiro"
                } />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {staffMembers.length === 0 ? (
                <div className="px-2 py-1 text-sm text-gray-600">
                  Carregando barbeiros...
                </div>
              ) : (
                <>
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

                  {staffAvailability.length === 0 && !isChecking && staffMembers.length > 0 && (
                    <div className="px-2 py-1 text-sm text-gray-600">
                      Verificando disponibilidade...
                    </div>
                  )}
                </>
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
