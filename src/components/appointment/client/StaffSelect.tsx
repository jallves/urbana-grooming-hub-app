
import React from 'react';
import { Staff } from '@/types/barber';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';

interface StaffSelectProps {
  staffMembers: Staff[];
  form: UseFormReturn<any>;
  barberAvailability?: { id: string; name: string; available: boolean }[];
  isCheckingAvailability?: boolean;
}

const StaffSelect: React.FC<StaffSelectProps> = ({
  staffMembers,
  form,
  barberAvailability = [],
  isCheckingAvailability = false
}) => {
  const availability = barberAvailability.length > 0 
    ? barberAvailability 
    : staffMembers.map(staff => ({ id: staff.id, name: staff.name, available: true }));

  const availableStaff = availability.filter(staff => staff.available);
  const unavailableStaff = availability.filter(staff => !staff.available);

  return (
    <FormField
      control={form.control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Barbeiro
            {isCheckingAvailability && <span className="ml-2 text-sm text-amber-400">(Verificando disponibilidade...)</span>}
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
            <SelectContent className="bg-stone-800 border-stone-600">
              {availableStaff.map((staff) => (
                <SelectItem 
                  key={staff.id} 
                  value={staff.id}
                  className="text-white hover:bg-stone-700"
                >
                  {staff.name} ✅ Disponível
                </SelectItem>
              ))}

              {unavailableStaff.map((staff) => (
                <SelectItem
                  key={staff.id}
                  value={staff.id}
                  disabled
                  className="opacity-50 text-stone-400"
                >
                  {staff.name} ❌ Indisponível
                </SelectItem>
              ))}

              {availableStaff.length === 0 && unavailableStaff.length > 0 && (
                <div className="px-2 py-1 text-sm text-red-400">
                  Nenhum barbeiro disponível neste horário
                </div>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default StaffSelect;
