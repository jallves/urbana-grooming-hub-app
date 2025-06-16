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
  // ... (código anterior)

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

  // ... (restante do componente)
}