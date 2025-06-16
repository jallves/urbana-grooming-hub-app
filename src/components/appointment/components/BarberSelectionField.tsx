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
      disabled={available === false}
      className={available === false 
        ? "text-zinc-500 opacity-50 cursor-not-allowed" 
        : "text-white hover:bg-zinc-700 focus:bg-zinc-700"
      }
    >
      <div className="flex items-center gap-3">
        {barber.image_url ? (
          <img 
            src={barber.image_url} 
            className="w-6 h-6 rounded-full object-cover" 
            alt={barber.name}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate flex items-center gap-2">
            {barber.name}
            {available === true && (
              <span className="text-xs text-green-500">Disponível</span>
            )}
          </div>
          <div className="flex gap-2 text-xs text-zinc-400">
            {barber.specialties && (
              <span className="truncate max-w-[120px]">{barber.specialties}</span>
            )}
            {barber.experience && (
              <span>• {barber.experience} anos</span>
            )}
          </div>
        </div>
        
        {available === undefined ? (
          <span className="text-blue-400 text-xs">Verificando...</span>
        ) : available ? (
          <span className="text-green-500">✓</span>
        ) : (
          <span className="text-red-500">✗</span>
        )}
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
          <Select 
            onValueChange={field.onChange} 
            value={field.value || ""}
            disabled={isCheckingAvailability}
          >
            <FormControl>
              <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-stone-800 border-stone-600 max-h-[300px] overflow-y-auto">
              {barbers.length > 0 ? (
                [...barbers]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((barber) => {
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