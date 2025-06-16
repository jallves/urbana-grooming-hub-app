
import React, { useEffect, useMemo } from 'react';
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
import { Barber } from '@/types/barber';

interface BarberSelectionFieldProps {
  control: Control<any>;
  barbers: Barber[];
  barberAvailability: { id: string; available: boolean }[];
  isCheckingAvailability: boolean;
  getFieldValue: (field: string) => any;
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
  
  useEffect(() => {
    const date = getFieldValue('date');
    const time = getFieldValue('time');
    const serviceId = getFieldValue('service_id');
    
    if (date && time && serviceId) {
      checkBarberAvailability(date, time, serviceId);
    }
  }, [getFieldValue('date'), getFieldValue('time'), getFieldValue('service_id'), checkBarberAvailability]);

  const renderBarberItem = (barber: Barber, available?: boolean) => (
    <SelectItem
      key={barber.id}
      value={barber.id}
      className={available === false 
        ? "text-zinc-500 opacity-50 cursor-not-allowed" 
        : "text-white hover:bg-zinc-700 focus:bg-zinc-700"
      }
    >
      <div className="flex items-center gap-2">
        {available === undefined ? (
          <span className="text-blue-400">👨‍💼</span>
        ) : available ? (
          <span className="text-green-500">✅</span>
        ) : (
          <span className="text-red-500">❌</span>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{barber.name}</div>
          {barber.email && (
            <div className="text-xs text-zinc-400 truncate">{barber.email}</div>
          )}
        </div>
      </div>
    </SelectItem>
  );

  return (
    <FormField
      control={control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-white flex items-center gap-2">
            <User className="h-4 w-4" />
            Barbeiro
            {isCheckingAvailability && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            )}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <FormControl>
              <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-stone-800 border-stone-600">
              {barbers.length > 0 ? (
                barbers.map((barber) => {
                  const availability = barberAvailability.find(a => a.id === barber.id);
                  return renderBarberItem(barber, availability?.available);
                })
              ) : (
                <div className="px-2 py-1 text-sm text-zinc-400">
                  Nenhum barbeiro disponível
                </div>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
