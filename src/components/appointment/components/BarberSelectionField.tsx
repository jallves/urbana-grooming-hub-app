
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { User } from 'lucide-react';
import { Control } from 'react-hook-form';
import { ClientAppointmentFormData } from '../hooks/useClientAppointmentForm';
import { StaffMember } from '@/types/appointment';

interface BarberAvailabilityInfo {
  id: string;
  name: string;
  available: boolean;
}

interface BarberSelectionFieldProps {
  control: Control<ClientAppointmentFormData>;
  barbers: StaffMember[];
  barberAvailability: BarberAvailabilityInfo[];
  isCheckingAvailability: boolean;
  getFieldValue: (field: keyof ClientAppointmentFormData) => any;
}

export function BarberSelectionField({ 
  control, 
  barbers, 
  barberAvailability, 
  isCheckingAvailability,
  getFieldValue 
}: BarberSelectionFieldProps) {
  const availableBarbers = barberAvailability.filter(barber => barber.available);
  const unavailableBarbers = barberAvailability.filter(barber => !barber.available);

  return (
    <FormField
      control={control}
      name="barberId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Barbeiro
            {isCheckingAvailability && <span className="ml-2 text-sm text-gray-500">(Verificando disponibilidade...)</span>}
          </FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value} 
            disabled={!getFieldValue('time') || isCheckingAvailability}
          >
            <FormControl>
              <SelectTrigger className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableBarbers.map(barber => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name} ✅ Disponível
                </SelectItem>
              ))}
              
              {unavailableBarbers.map(barber => (
                <SelectItem 
                  key={barber.id} 
                  value={barber.id} 
                  disabled
                  className="opacity-50"
                >
                  {barber.name} ❌ Indisponível
                </SelectItem>
              ))}
              
              {barberAvailability.length === 0 && barbers
                .filter(barber => barber.is_active)
                .map(barber => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
          <FormMessage />
          {availableBarbers.length === 0 && barberAvailability.length > 0 && (
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
