
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { StaffFormValues } from '../hooks/useStaffForm';

interface StaffProfessionalInfoProps {
  form: UseFormReturn<StaffFormValues>;
}

const StaffProfessionalInfo: React.FC<StaffProfessionalInfoProps> = ({ form }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Função</FormLabel>
            <FormControl>
              <Input placeholder="Função do profissional" {...field} value={field.value || ''} />
            </FormControl>
            <FormDescription>
              Ex: Barbeiro, Cabeleireiro, Manicure, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="experience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Experiência</FormLabel>
            <FormControl>
              <Input placeholder="Ex: +5 anos" {...field} value={field.value || ''} />
            </FormControl>
            <FormDescription>
              Tempo de experiência do profissional
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default StaffProfessionalInfo;
