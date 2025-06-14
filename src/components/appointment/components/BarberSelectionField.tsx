
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
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import { User, Loader2, AlertTriangle } from 'lucide-react';
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

// Utilitário para buscar barbeiro por ID (evita código repetido)
const getBarberById = (barbers: StaffMember[], id: string) =>
  barbers.find((b) => b.id === id);

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

  // Atualiza a disponibilidade ao mudar data/hora/serviço
  useEffect(() => {
    // Certifique-se que checkBarberAvailability está memoizado no hook original
    if (selectedDate && selectedTime && selectedServiceId) {
      checkBarberAvailability(selectedDate, selectedTime, selectedServiceId);
    }
  }, [selectedDate, selectedTime, selectedServiceId, checkBarberAvailability]);

  // LOG extra para depuração
  React.useEffect(() => {
    console.log('Barbeiros recebidos para seleção:', barbers);
  }, [barbers]);

  const availableBarbers = barberAvailability.filter((b) => b.available);
  const unavailableBarbers = barberAvailability.filter((b) => !b.available);

  const shouldShowAllBarbers =
    !selectedDate || !selectedTime || !selectedServiceId || barberAvailability.length === 0;

  // Só mostra barbeiros ativos, role=barber, vindo do banco
  const activeBarbers = Array.isArray(barbers)
    ? barbers.filter(
        (b) => !!b && b.is_active === true && b.role === 'barber'
      )
    : [];

  // Função para abrir o admin no painel de profissionais (nova aba)
  const redirectToAdminStaff = () => {
    window.open('/admin/barbeiros', '_blank');
  };

  // Skeleton simples para loading opcional (pode-se aprimorar visual depois)
  const SkeletonBarberItem = () => (
    <div className="px-4 py-2">
      <div className="w-36 h-5 bg-zinc-700 rounded animate-pulse mb-1"></div>
    </div>
  );

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
            <Alert className="mt-2 bg-yellow-900/20 border-yellow-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <AlertTriangle className="h-4 w-4 text-yellow-400 mb-1" />
                <AlertTitle className="text-yellow-400">Nenhum barbeiro cadastrado</AlertTitle>
                <AlertDescription className="text-yellow-300">
                  Não há barbeiros ativos cadastrados no sistema.<br />
                  Entre em contato conosco pelo WhatsApp para agendar seu horário.<br />
                  <span className="block mt-2">Ou cadastre seu primeiro barbeiro no painel admin abaixo:</span>
                </AlertDescription>
              </div>
              <button
                type="button"
                className="bg-urbana-gold text-black px-4 py-2 rounded-lg mt-2 sm:mt-0 hover:bg-urbana-gold/90 font-semibold transition"
                onClick={redirectToAdminStaff}
              >
                Cadastrar primeiro barbeiro
              </button>
            </Alert>
          )}

          <Select
            onValueChange={field.onChange}
            value={field.value || ''}
            disabled={
              !selectedTime ||
              isCheckingAvailability ||
              activeBarbers.length === 0
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
                      ? 'Entre em contato conosco'
                      : 'Selecione um barbeiro'
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-zinc-800 border-zinc-600">
              {isCheckingAvailability ? (
                // Apresenta skeletons enquanto carrega disponibilidade
                <>
                  {[1, 2, 3].map((k) => (
                    <SkeletonBarberItem key={k} />
                  ))}
                </>
              ) : shouldShowAllBarbers ? (
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
                  {availableBarbers
                    .filter((b) => {
                      const barberObj = getBarberById(barbers, b.id);
                      return barberObj && barberObj.is_active === true && barberObj.role === 'barber';
                    })
                    .map((barber) => {
                      const barberObj = getBarberById(barbers, barber.id);
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

                  {unavailableBarbers
                    .filter((b) => {
                      const barberObj = getBarberById(barbers, b.id);
                      return barberObj && barberObj.is_active === true && barberObj.role === 'barber';
                    })
                    .map((barber) => {
                      const barberObj = getBarberById(barbers, barber.id);
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

          {selectedTime &&
            !shouldShowAllBarbers &&
            availableBarbers.length === 0 &&
            activeBarbers.length > 0 &&
            !isCheckingAvailability && (
              <Alert
                className="mt-2 bg-red-900/20 border-red-700"
                variant="destructive"
              >
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

// Arquivo está ficando longo! Recomendo que você peça um refactor para dividir esse componente em arquivos menores.
