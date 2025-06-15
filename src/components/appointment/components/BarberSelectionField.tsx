
import React, { useEffect } from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Loader2 } from 'lucide-react';
import { Control } from 'react-hook-form';
import {
  FormData,
  BarberAvailabilityInfo,
} from 'src/components/appointment/hooks/useClientAppointmentForm.ts';
import { Barber } from '@/types/barber';

interface BarberSelectionFieldProps {
  control: Control<FormData>;
  barbers: Barber[];
  barberAvailability: BarberAvailabilityInfo[];
  isCheckingAvailability: boolean;
  getFieldValue: (field: keyof FormData) => any;
  checkBarberAvailability: (date: Date, time: string, serviceId: string) => Promise<void>;
}

export function BarberSelectionField({
  control,
  barbers,
  barberAvailability,
  isCheckingAvailability,
  getFieldValue,
  checkBarberAvailability,
}: BarberSelectionFieldProps): JSX.Element {
  const selectedDate = getFieldValue('date');
  const selectedTime = getFieldValue('time');
  const selectedServiceId = getFieldValue('service_id');

  console.log('[BarberSelectionField] Props:', {
    barbersCount: barbers?.length || 0,
    barbers: barbers,
    selectedDate,
    selectedTime,
    selectedServiceId,
  });

  useEffect(() => {
    if (selectedDate && selectedTime && selectedServiceId && barbers.length > 0) {
      console.log('[BarberSelectionField] Verificando disponibilidade...');
      checkBarberAvailability(selectedDate, selectedTime, selectedServiceId);
    }
  }, [selectedDate, selectedTime, selectedServiceId, checkBarberAvailability, barbers.length]);

  // Validar se barbers é um array válido
  const validBarbers = Array.isArray(barbers) ? barbers.filter(b => b && b.id && b.name) : [];
  
  console.log('[BarberSelectionField] Barbeiros válidos:', validBarbers);

  const availableBarbers = barberAvailability.filter((b) => b.available);
  const unavailableBarbers = barberAvailability.filter((b) => !b.available);

  const shouldShowAllBarbers =
    !selectedDate || !selectedTime || !selectedServiceId || barberAvailability.length === 0;

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
          <Select
            onValueChange={field.onChange}
            value={field.value || ''}
            disabled={isCheckingAvailability}
          >
            <FormControl>
              <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-urbana-gold focus:ring-urbana-gold/20">
                <User className="mr-2 h-4 w-4" />
                <SelectValue
                  placeholder={
                    isCheckingAvailability
                      ? 'Verificando disponibilidade...'
                      : validBarbers.length === 0
                      ? 'Nenhum barbeiro encontrado'
                      : 'Selecione um barbeiro'
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-zinc-800 border-zinc-600">
              {validBarbers.length === 0 ? (
                <div className="px-2 py-4 text-center text-zinc-400">
                  <div className="mb-2">❌ Nenhum barbeiro encontrado</div>
                  <div className="text-xs">
                    Verifique se há barbeiros cadastrados e ativos no sistema.
                  </div>
                </div>
              ) : shouldShowAllBarbers ? (
                // Mostrar todos os barbeiros quando não há filtro de disponibilidade
                validBarbers.map((barber) => (
                  <SelectItem
                    key={barber.id}
                    value={barber.id}
                    className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">👨‍💼</span>
                      {barber.name}
                      {barber.specialties && (
                        <span className="text-xs text-zinc-400">({barber.specialties})</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <>
                  {/* Barbeiros disponíveis */}
                  {availableBarbers.length > 0 &&
                    availableBarbers.map((barberAvailability) => {
                      const barber = validBarbers.find(b => b.id === barberAvailability.id);
                      if (!barber) return null;
                      
                      return (
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
                      );
                    })}

                  {/* Barbeiros indisponíveis */}
                  {unavailableBarbers.length > 0 &&
                    unavailableBarbers.map((barberAvailability) => {
                      const barber = validBarbers.find(b => b.id === barberAvailability.id);
                      if (!barber) return null;
                      
                      return (
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
                      );
                    })}

                  {/* Aviso se nenhum barbeiro disponível */}
                  {!isCheckingAvailability &&
                    availableBarbers.length === 0 &&
                    validBarbers.length > 0 && (
                      <div className="px-2 py-1 text-sm text-red-400">
                        Nenhum barbeiro disponível neste horário
                      </div>
                    )}
                </>
              )}
            </SelectContent>
          </Select>

          <FormMessage />

          {/* Informações de status */}
          {!selectedTime && validBarbers.length > 0 && (
            <p className="text-sm text-zinc-400">
              ℹ️ Selecione data e horário para verificar disponibilidade
            </p>
          )}

          {selectedTime &&
            !shouldShowAllBarbers &&
            availableBarbers.length === 0 &&
            validBarbers.length > 0 &&
            !isCheckingAvailability && (
              <div className="mt-2 bg-red-900/20 border-red-700 border rounded-lg p-3">
                <span className="text-red-400 font-semibold">⚠️ Nenhum barbeiro disponível</span>
                <div className="text-red-300 text-sm mt-1">
                  Não há barbeiros disponíveis para o horário selecionado. Escolha outro horário ou selecione um barbeiro indisponível (sujeito a confirmação).
                </div>
              </div>
            )}
        </FormItem>
      )}
    />
  );
}
