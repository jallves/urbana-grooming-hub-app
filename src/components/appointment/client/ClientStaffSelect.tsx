
import React, { useEffect, useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

interface ClientStaffSelectProps {
  barbers: Barber[];
  form: UseFormReturn<any>;
  selectedDate?: Date;
  selectedTime?: string;
  serviceDuration?: number;
}

const ClientStaffSelect: React.FC<ClientStaffSelectProps> = ({
  barbers,
  form,
  selectedDate,
  selectedTime,
  serviceDuration = 60
}) => {
  const [availableBarbers, setAvailableBarbers] = useState<Barber[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkBarberAvailability = async () => {
    console.log('[ClientStaffSelect] Verificando disponibilidade...', {
      barbersCount: barbers.length,
      selectedDate,
      selectedTime,
      serviceDuration
    });

    // Se não há data/hora selecionada, mostrar todos os barbeiros
    if (!selectedDate || !selectedTime) {
      console.log('[ClientStaffSelect] Sem data/hora - mostrando todos os barbeiros');
      setAvailableBarbers(barbers);
      return;
    }

    setIsChecking(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceDuration);

      console.log('[ClientStaffSelect] Verificando conflitos para:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      const available: Barber[] = [];

      for (const barber of barbers) {
        // Verificar conflitos com agendamentos existentes
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', barber.id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lt('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          console.error(`[ClientStaffSelect] Erro verificando ${barber.name}:`, error);
          // Em caso de erro, assumir disponível
          available.push(barber);
          continue;
        }

        // Verificar conflitos de horário
        const hasConflict = appointments?.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          return startTime < appEnd && endTime > appStart;
        }) || false;

        if (!hasConflict) {
          available.push(barber);
        }

        console.log(`[ClientStaffSelect] ${barber.name}: ${hasConflict ? 'ocupado' : 'disponível'}`);
      }

      console.log('[ClientStaffSelect] Resultado:', {
        totalBarbers: barbers.length,
        availableBarbers: available.length
      });

      setAvailableBarbers(available);

      // Se o barbeiro atual não está mais disponível, limpar seleção
      const currentStaffId = form.getValues('staff_id');
      if (currentStaffId && !available.find(b => b.id === currentStaffId)) {
        form.setValue('staff_id', '');
        toast({
          title: "Barbeiro indisponível",
          description: "O barbeiro selecionado não está disponível neste horário.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('[ClientStaffSelect] Erro na verificação:', error);
      // Em caso de erro, mostrar todos os barbeiros
      setAvailableBarbers(barbers);
      toast({
        title: "Aviso",
        description: "Não foi possível verificar disponibilidade. Mostrando todos os barbeiros.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBarberAvailability();
  }, [selectedDate, selectedTime, serviceDuration, barbers.length]);

  return (
    <FormField
      control={form.control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white">
            Barbeiro *
            {isChecking && (
              <span className="ml-2 text-sm text-[#9CA3AF] flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando...
              </span>
            )}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value || ""}
            disabled={isChecking}
          >
            <FormControl>
              <SelectTrigger className="bg-[#1F2937] border-gray-600 text-white">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-[#1F2937] border-gray-600">
              {availableBarbers.length > 0 ? (
                availableBarbers.map((barber) => (
                  <SelectItem 
                    key={barber.id} 
                    value={barber.id}
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{barber.name}</div>
                      {barber.specialties && (
                        <div className="text-xs text-gray-400">
                          {barber.specialties}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-red-400">
                  {selectedDate && selectedTime 
                    ? 'Nenhum barbeiro disponível neste horário'
                    : 'Carregando barbeiros...'
                  }
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
