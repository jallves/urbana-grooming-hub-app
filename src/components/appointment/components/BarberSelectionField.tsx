
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
import { StaffMember } from '@/types/appointment';

interface BarberSelectionFieldProps {
  control: Control<FormData>;
  barbers: StaffMember[];
  barberAvailability: BarberAvailabilityInfo[];
  isCheckingAvailability: boolean;
  getFieldValue: (field: keyof FormData) => any;
  checkBarberAvailability: (date: Date, time: string, serviceId: string) => Promise<void>;
}

// Utilitário para buscar barbeiro por ID (aceita chefes com id/barber_id)
const getBarberById = (barbers: any[], id: string) =>
  barbers.find((b) => (b?.id === id || b?.barber_id === id));

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

  useEffect(() => {
    if (selectedDate && selectedTime && selectedServiceId) {
      checkBarberAvailability(selectedDate, selectedTime, selectedServiceId);
    }
  }, [selectedDate, selectedTime, selectedServiceId, checkBarberAvailability]);

  React.useEffect(() => {
    console.log('Barbeiros recebidos para seleção:', barbers);
    console.log('[BarberSelectionField] barberAvailability:', barberAvailability);
    console.log('[BarberSelectionField] activeBarbers:', Array.isArray(barbers)
      ? barbers.filter(b => !!b && b.is_active === true && b.role === 'barber')
      : []);
    console.log('[BarberSelectionField] Valores selecionados:', {
      selectedDate: getFieldValue('date'),
      selectedTime: getFieldValue('time'),
      selectedServiceId: getFieldValue('service_id'),
    });
    // Novo log para inspecionar logicamente quem deveria aparecer:
    const availableBarbers = barberAvailability.filter((b) => b.available);
    const unavailableBarbers = barberAvailability.filter((b) => !b.available);
    console.log("Barbeiros disponíveis:", availableBarbers.map(b => b.id));
    console.log("Barbeiros indisponíveis:", unavailableBarbers.map(b => b.id));
  }, [barbers, barberAvailability, getFieldValue]);

  const availableBarbers = barberAvailability.filter((b) => b.available);
  const unavailableBarbers = barberAvailability.filter((b) => !b.available);

  // novo: filtro explícito - garantir uso correto do array
  const shouldShowAllBarbers =
    !selectedDate || !selectedTime || !selectedServiceId || barberAvailability.length === 0;

  const activeBarbers = Array.isArray(barbers)
    ? barbers.filter(
        (b) =>
          !!b &&
          b.is_active === true &&
          (b.role === 'barber')
      )
    : [];

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
            disabled={
              !selectedTime || isCheckingAvailability || activeBarbers.length === 0
            }
          >
            <FormControl>
              <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-urbana-gold focus:ring-urbana-gold/20">
                <User className="mr-2 h-4 w-4" />
                <SelectValue
                  placeholder={
                    !selectedTime
                      ? 'Selecione um horário primeiro'
                      : isCheckingAvailability
                      ? 'Verificando disponibilidade...'
                      : activeBarbers.length === 0
                      ? 'Sem barbeiros disponíveis'
                      : 'Selecione um barbeiro'
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-zinc-800 border-zinc-600">
              {shouldShowAllBarbers ? (
                // Quando não filtrando por disponibilidade
                activeBarbers.map((barber) => (
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
                  {/* Aqui garantimos que, se availableBarbers.length > 0, vamos mostrar! */}
                  {availableBarbers.length > 0 &&
                    availableBarbers
                      .filter((b) => {
                        const barberObj = barbers.find(x => x.id === b.id);
                        return barberObj && barberObj.is_active === true && barberObj.role === 'barber';
                      })
                      .map((barber) => {
                        const barberObj = barbers.find(x => x.id === barber.id);
                        if (!barberObj) return null;
                        return (
                          <SelectItem
                            key={barber.id}
                            value={barber.id}
                            className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">✅</span>
                              {barberObj.name}
                              <span className="text-sm text-zinc-400">Disponível</span>
                            </div>
                          </SelectItem>
                        );
                      })}

                  {/* Se houver indisponíveis, mostrar mas desabilitados */}
                  {unavailableBarbers.length > 0 &&
                    unavailableBarbers
                      .filter((b) => {
                        const barberObj = barbers.find(x => x.id === b.id);
                        return barberObj && barberObj.is_active === true && barberObj.role === 'barber';
                      })
                      .map((barber) => {
                        const barberObj = barbers.find(x => x.id === barber.id);
                        if (!barberObj) return null;
                        return (
                          <SelectItem
                            key={barber.id}
                            value={barber.id}
                            disabled
                            className="text-zinc-500 opacity-50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-red-500">❌</span>
                              {barberObj.name}
                              <span className="text-sm text-zinc-500">Indisponível</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                </>
              )}

              {/* Só mostra o alerta se realmente ninguém estiver disponível! */}
              {!shouldShowAllBarbers &&
                !isCheckingAvailability &&
                availableBarbers.length === 0 &&
                activeBarbers.length > 0 && (
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

          {/* Mostrar box só se realmente ninguém estiver disponível */}
          {selectedTime &&
            !shouldShowAllBarbers &&
            availableBarbers.length === 0 &&
            activeBarbers.length > 0 &&
            !isCheckingAvailability && (
              <div
                className="mt-2 bg-red-900/20 border-red-700 border rounded-lg p-3"
              >
                <span className="text-red-400 font-semibold">Nenhum barbeiro disponível</span>
                <div className="text-red-300">
                  Não há barbeiros disponíveis para o horário selecionado. Por favor, escolha outro horário.
                </div>
              </div>
            )}
        </FormItem>
      )}
    />
  );
}

// O componente está ficando grande. Recomendo que você peça um refactor para dividir esse componente em arquivos menores.
