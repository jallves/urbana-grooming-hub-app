
import React, { useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { User, Loader2, AlertTriangle } from 'lucide-react';
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

  // Filter only active barbers
  const activeBarbers = barbers.filter(barber => barber.is_active);

  // If no availability check has been done yet, show all active barbers
  const showAllBarbers = !selectedDate || !selectedTime || barberAvailability.length === 0;

  console.log('BarberSelectionField - todos os barbeiros:', barbers);
  console.log('BarberSelectionField - barbeiros ativos:', activeBarbers);
  console.log('BarberSelectionField - showAllBarbers:', showAllBarbers);
  console.log('BarberSelectionField - availableBarbers:', availableBarbers);

  return (
    <FormField
      control={control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-white">
            Barbeiro
            {isCheckingAvailability && (
              <div className="flex items-center gap-1 text-sm text-zinc-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando disponibilidade...
              </div>
            )}
          </FormLabel>
          
          {activeBarbers.length === 0 && (
            <Alert className="mt-2 bg-yellow-900/20 border-yellow-700">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertTitle className="text-yellow-400">Sistema em configuração</AlertTitle>
              <AlertDescription className="text-yellow-300">
                Os barbeiros estão sendo configurados no sistema. Por favor, entre em contato conosco pelo WhatsApp para agendar seu horário ou tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          )}
          
          <Select 
            onValueChange={field.onChange} 
            value={field.value || ""} 
            disabled={!selectedTime || isCheckingAvailability || activeBarbers.length === 0}
          >
            <FormControl>
              <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-urbana-gold focus:ring-urbana-gold/20">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder={
                  activeBarbers.length === 0 
                    ? "Entre em contato conosco" 
                    : "Selecione um barbeiro"
                } />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-zinc-800 border-zinc-600">
              {showAllBarbers ? (
                // Show all active barbers when no availability check is done
                activeBarbers.map(barber => (
                  <SelectItem 
                    key={barber.id} 
                    value={barber.id}
                    className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                  >
                    {barber.name}
                  </SelectItem>
                ))
              ) : (
                <>
                  {/* Available barbers first */}
                  {availableBarbers.map(barber => (
                    <SelectItem 
                      key={barber.id} 
                      value={barber.id}
                      className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        {barber.name}
                        <span className="text-sm text-zinc-400">Disponível</span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Unavailable barbers */}
                  {unavailableBarbers.map(barber => (
                    <SelectItem 
                      key={barber.id} 
                      value={barber.id} 
                      disabled
                      className="text-zinc-500 opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">❌</span>
                        {barber.name}
                        <span className="text-sm text-zinc-500">Indisponível</span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              {!showAllBarbers && availableBarbers.length === 0 && activeBarbers.length > 0 && (
                <div className="px-2 py-1 text-sm text-red-400">
                  Nenhum barbeiro disponível neste horário
                </div>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
          
          {!selectedTime && activeBarbers.length > 0 && (
            <p className="text-sm text-zinc-400">
              Selecione um horário primeiro para verificar disponibilidade
            </p>
          )}
          
          {selectedTime && !showAllBarbers && availableBarbers.length === 0 && activeBarbers.length > 0 && (
            <Alert className="mt-2 bg-red-900/20 border-red-700" variant="destructive">
              <AlertTitle className="text-red-400">Nenhum barbeiro disponível</AlertTitle>
              <AlertDescription className="text-red-300">
                Não há barbeiros disponíveis para o horário selecionado. Por favor, escolha outro horário.
              </AlertDescription>
            </Alert>
          )}
        </FormItem>
      )}
    />
  );
}
