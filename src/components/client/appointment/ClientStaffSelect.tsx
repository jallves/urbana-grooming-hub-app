import React, { useEffect, useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { User, Loader2 } from 'lucide-react';

// Tipo simplificado para Staff Member compatível com a tabela staff
interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  image_url?: string;
  specialties?: string;
  experience?: string;
}

interface ClientStaffSelectProps {
  staffMembers: StaffMember[];
  form: UseFormReturn<any>;
  selectedDate?: Date;
  selectedTime?: string;
  serviceDuration?: number;
  appointmentId?: string;
}

const ClientStaffSelect: React.FC<ClientStaffSelectProps> = ({
  staffMembers,
  form,
  selectedDate,
  selectedTime,
  serviceDuration = 60,
  appointmentId
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Quando o barbeiro muda, limpar data e horário para forçar nova seleção
  const handleBarbeiroChange = (value: string) => {
    form.setValue('staff_id', value);
    form.setValue('time', ''); // Limpar horário quando muda barbeiro
  };

  console.log('🔍 ClientStaffSelect - Props:', {
    staffMembersCount: staffMembers?.length || 0,
    selectedStaffId: form.watch('staff_id')
  });

  return (
    <FormField
      control={form.control}
      name="staff_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            Barbeiro
          </FormLabel>
          <Select
            onValueChange={handleBarbeiroChange}
            value={field.value || ""}
            disabled={isLoading}
          >
            <FormControl>
              <SelectTrigger className="h-11 bg-background border-input">
                <SelectValue placeholder={
                  staffMembers.length === 0 
                    ? "Carregando barbeiros..." 
                    : "Selecione um barbeiro"
                } />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-popover border-border">
              {staffMembers.length === 0 ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando barbeiros...
                </div>
              ) : (
                staffMembers.map((staff) => (
                  <SelectItem 
                    key={staff.id} 
                    value={staff.id}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{staff.name}</span>
                      {staff.specialties && (
                        <span className="text-xs text-muted-foreground">
                          • {staff.specialties}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ClientStaffSelect;
