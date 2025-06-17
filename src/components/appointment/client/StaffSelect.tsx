
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
  console.log('[StaffSelect] Props recebidas:', {
    staffMembersCount: staffMembers.length,
    barberAvailabilityCount: barberAvailability.length,
    isCheckingAvailability,
    staffMembers: staffMembers.slice(0, 3)
  });

  if (staffMembers.length === 0) {
    return (
      <FormField
        control={form.control}
        name="staff_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Barbeiro</FormLabel>
            <FormControl>
              <div className="p-3 bg-stone-700 border border-stone-600 rounded text-stone-400 text-center">
                Carregando barbeiros...
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Se não há dados de disponibilidade ainda, mostrar todos os barbeiros como disponíveis
  const shouldShowAvailability = barberAvailability.length > 0;
  
  let availableStaff = [];
  let unavailableStaff = [];

  if (shouldShowAvailability) {
    availableStaff = barberAvailability.filter(staff => staff.available);
    unavailableStaff = barberAvailability.filter(staff => !staff.available);
  } else {
    // Se não há dados de disponibilidade, mostrar todos como disponíveis
    availableStaff = staffMembers.map(staff => ({ 
      id: staff.id, 
      name: staff.name, 
      available: true 
    }));
  }

  console.log('[StaffSelect] Barbeiros processados:', {
    availableCount: availableStaff.length,
    unavailableCount: unavailableStaff.length,
    shouldShowAvailability
  });

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
            onValueChange={(value) => {
              console.log('[StaffSelect] Barbeiro selecionado:', value);
              field.onChange(value);
            }}
            value={field.value || ""}
            disabled={isCheckingAvailability}
          >
            <FormControl>
              <SelectTrigger className="bg-stone-700 border-stone-600 text-white">
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-stone-800 border-stone-600">
              {/* Barbeiros disponíveis */}
              {availableStaff.map((staff) => {
                const staffMember = staffMembers.find(s => s.id === staff.id);
                if (!staffMember) return null;
                
                return (
                  <SelectItem 
                    key={staff.id} 
                    value={staff.id}
                    className="text-white hover:bg-stone-700"
                  >
                    <div className="flex flex-col w-full">
                      <div className="flex items-center justify-between w-full">
                        <span>{staff.name}</span>
                        {shouldShowAvailability && (
                          <span className="text-green-400 text-xs ml-2">✅ Disponível</span>
                        )}
                      </div>
                      {staffMember.specialties && (
                        <div className="text-xs text-stone-400 mt-1">
                          {staffMember.specialties}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                );
              })}

              {/* Barbeiros indisponíveis (apenas se houver dados de disponibilidade) */}
              {shouldShowAvailability && unavailableStaff.map((staff) => {
                const staffMember = staffMembers.find(s => s.id === staff.id);
                if (!staffMember) return null;
                
                return (
                  <SelectItem
                    key={staff.id}
                    value={staff.id}
                    disabled
                    className="opacity-50 text-stone-400"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{staff.name}</span>
                      <span className="text-red-400 text-xs ml-2">❌ Indisponível</span>
                    </div>
                  </SelectItem>
                );
              })}

              {/* Mensagem quando nenhum barbeiro está disponível */}
              {shouldShowAvailability && availableStaff.length === 0 && unavailableStaff.length > 0 && (
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
