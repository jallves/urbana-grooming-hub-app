
import React, { useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { User, Loader2 } from 'lucide-react';
import { Control } from 'react-hook-form';
import { FormData, BarberAvailabilityInfo } from '../hooks/useClientAppointmentForm';
import { StaffMember } from '@/types/appointment';

interface BarberSelectionFieldProps {
  control: Control<FormData>;
  barbers: StaffMember[];
  barberAvailability: BarberAvailabilityInfo[];
  isCheckingAvailability: boolean;
  getFieldValue: (field: keyof FormData) => any;
  checkBarberAvailability?: (date: Date, time: string, serviceId: string) => Promise<void>;
}

export function BarberSelectionField({ 
  control, 
  barbers, 
  barberAvailability, 
  isCheckingAvailability,
  getFieldValue,
  checkBarberAvailability
}: BarberSelectionFieldProps) {
  const selectedDate = getFieldValue('date');
  const selectedTime = getFieldValue('time');
  const selectedServiceId = getFieldValue('service_id');
  
  // Check barber availability when date, time, or service changes
  useEffect(() => {
    if (selectedDate && selectedTime && selectedServiceId && checkBarberAvailability) {
      checkBarberAvailability(selectedDate, selectedTime, selectedServiceId);
    }
  }, [selectedDate, selectedTime, selectedServiceId, checkBarberAvailability]);
  
  const availableBarbers = barberAvailability.filter(barber => barber.available);
  const unavailableBarbers = barberAvailability.filter(barber => !barber.available);

  // If no availability check has been done yet, show all barbers
  const showAllBarbers = !selectedDate || !selectedTime || barberAvailability.length === 0;

  return (
    <FormField
      control={control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            Barbeiro
            {isCheckingAvailability && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando disponibilidade...
              </div>
            )}
          </FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value || ""} 
            disabled={!selectedTime || isCheckingAvailability}
          >
            <FormControl>
              <SelectTrigger className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {showAllBarbers ? (
                // Show all barbers when no availability check is done
                barbers
                  .filter(barber => barber.is_active)
                  .map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))
              ) : (
                <>
                  {/* Available barbers first */}
                  {availableBarbers.map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✅</span>
                        {barber.name}
                        <span className="text-sm text-muted-foreground">Disponível</span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Unavailable barbers */}
                  {unavailableBarbers.map(barber => (
                    <SelectItem 
                      key={barber.id} 
                      value={barber.id} 
                      disabled
                      className="opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-red-600">❌</span>
                        {barber.name}
                        <span className="text-sm text-muted-foreground">Indisponível</span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              {!showAllBarbers && availableBarbers.length === 0 && (
                <div className="px-2 py-1 text-sm text-red-600">
                  Nenhum barbeiro disponível neste horário
                </div>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
          
          {!selectedTime && (
            <p className="text-sm text-muted-foreground">
              Selecione um horário primeiro
            </p>
          )}
          
          {selectedTime && !showAllBarbers && availableBarbers.length === 0 && (
            <Alert className="mt-2" variant="destructive">
              <AlertTitle>Nenhum barbeiro disponível</AlertTitle>
              <AlertDescription>
                Não há barbeiros disponíveis para o horário selecionado. Por favor, escolha outro horário.
              </AlertDescription>
            </Alert>
          )}
        </FormItem>
      )}
    />
  );
}
