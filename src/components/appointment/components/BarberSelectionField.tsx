
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
      console.log('Verificando disponibilidade para:', { selectedDate, selectedTime, selectedServiceId });
      checkBarberAvailability(selectedDate, selectedTime, selectedServiceId);
    }
  }, [selectedDate, selectedTime, selectedServiceId, checkBarberAvailability]);
  
  const availableBarbers = barberAvailability.filter(barber => barber.available);
  const unavailableBarbers = barberAvailability.filter(barber => !barber.available);

  // Se não foi feita verificação de disponibilidade ainda, mostrar todos os barbeiros ativos
  const shouldShowAllBarbers = !selectedDate || !selectedTime || !selectedServiceId || barberAvailability.length === 0;
  
  // Filtrar apenas barbeiros ativos
  const activeBarbers = barbers.filter(barber => barber.is_active);

  console.log('BarberSelectionField - Estado atual:', {
    totalBarbers: barbers.length,
    activeBarbers: activeBarbers.length,
    shouldShowAllBarbers,
    availableBarbers: availableBarbers.length,
    unavailableBarbers: unavailableBarbers.length,
    isCheckingAvailability,
    barberAvailability
  });

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
              <AlertTitle className="text-yellow-400">Nenhum barbeiro cadastrado</AlertTitle>
              <AlertDescription className="text-yellow-300">
                Não há barbeiros ativos cadastrados no sistema. Entre em contato conosco pelo WhatsApp para agendar seu horário.
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
                    : isCheckingAvailability
                    ? "Verificando disponibilidade..."
                    : "Selecione um barbeiro"
                } />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-zinc-800 border-zinc-600">
              {shouldShowAllBarbers ? (
                // Mostrar todos os barbeiros ativos quando não há verificação de disponibilidade
                activeBarbers.map(barber => (
                  <SelectItem 
                    key={barber.id} 
                    value={barber.id}
                    className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✅</span>
                      {barber.name}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <>
                  {/* Barbeiros disponíveis primeiro */}
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
                  
                  {/* Barbeiros indisponíveis */}
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
              
              {!shouldShowAllBarbers && availableBarbers.length === 0 && activeBarbers.length > 0 && (
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
          
          {selectedTime && !shouldShowAllBarbers && availableBarbers.length === 0 && activeBarbers.length > 0 && (
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
