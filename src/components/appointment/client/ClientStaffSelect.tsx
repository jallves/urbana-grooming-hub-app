
import React, { useEffect, useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UseFormReturn } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

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

interface BarberAvailability {
  id: string;
  name: string;
  available: boolean;
  image_url?: string;
  specialties?: string;
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
  const [staffAvailability, setStaffAvailability] = useState<BarberAvailability[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkStaffAvailability = async () => {
    if (!selectedDate || !selectedTime || !barbers.length) {
      // Show all barbers as available when no date/time selected
      setStaffAvailability(barbers.map(barber => ({
        id: barber.id,
        name: barber.name,
        available: true,
        image_url: barber.image_url,
        specialties: barber.specialties
      })));
      return;
    }

    setIsChecking(true);

    try {
      console.log('[ClientStaffSelect] Checking availability...', {
        date: selectedDate,
        time: selectedTime,
        duration: serviceDuration
      });

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceDuration);

      const availability: BarberAvailability[] = [];

      for (const barber of barbers) {
        // Check for appointment conflicts
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('id, start_time, end_time')
          .eq('staff_id', barber.id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('start_time', startTime.toISOString().split('T')[0])
          .lt('start_time', new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (error) {
          console.error(`Error checking availability for ${barber.name}:`, error);
          availability.push({
            id: barber.id,
            name: barber.name,
            available: false,
            image_url: barber.image_url,
            specialties: barber.specialties
          });
          continue;
        }

        // Check for time conflicts
        const hasConflict = appointments?.some(appointment => {
          const appStart = new Date(appointment.start_time);
          const appEnd = new Date(appointment.end_time);
          return startTime < appEnd && endTime > appStart;
        }) || false;

        availability.push({
          id: barber.id,
          name: barber.name,
          available: !hasConflict,
          image_url: barber.image_url,
          specialties: barber.specialties
        });
      }

      setStaffAvailability(availability);

      // Auto-adjust selection if current barber is unavailable
      const currentStaffId = form.getValues('staff_id');
      if (currentStaffId) {
        const currentStaffAvailable = availability.find(s => s.id === currentStaffId)?.available;
        if (!currentStaffAvailable) {
          const firstAvailable = availability.find(s => s.available);
          if (firstAvailable) {
            form.setValue('staff_id', firstAvailable.id);
            toast({
              title: "Barbeiro ajustado",
              description: `${firstAvailable.name} foi selecionado automaticamente.`,
            });
          } else {
            form.setValue('staff_id', '');
            toast({
              title: "Nenhum barbeiro disponível",
              description: "Escolha outro horário ou data.",
              variant: "destructive",
            });
          }
        }
      }

    } catch (error) {
      console.error('[ClientStaffSelect] Error checking availability:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar disponibilidade.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStaffAvailability();
  }, [selectedDate, selectedTime, serviceDuration, barbers.length]);

  const availableStaff = staffAvailability.filter(staff => staff.available);
  const unavailableStaff = staffAvailability.filter(staff => !staff.available);

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
              {/* Available barbers */}
              {availableStaff.map((staff) => (
                <SelectItem 
                  key={staff.id} 
                  value={staff.id}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={staff.image_url} alt={staff.name} />
                      <AvatarFallback className="bg-[#F59E0B] text-black">
                        {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{staff.name}</div>
                      {staff.specialties && (
                        <div className="text-xs text-gray-400">
                          {staff.specialties}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  </div>
                </SelectItem>
              ))}

              {/* Unavailable barbers */}
              {unavailableStaff.map((staff) => (
                <SelectItem
                  key={staff.id}
                  value={staff.id}
                  disabled
                  className="opacity-50 text-gray-400"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={staff.image_url} alt={staff.name} />
                      <AvatarFallback className="bg-gray-600 text-gray-300">
                        {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{staff.name}</div>
                      {staff.specialties && (
                        <div className="text-xs text-gray-500">
                          {staff.specialties}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-red-400 border-red-400">
                      <XCircle className="h-3 w-3 mr-1" />
                      Ocupado
                    </Badge>
                  </div>
                </SelectItem>
              ))}

              {/* No barbers available message */}
              {availableStaff.length === 0 && unavailableStaff.length > 0 && (
                <div className="px-2 py-4 text-center text-red-400">
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
