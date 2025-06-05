
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { UseFormReturn } from 'react-hook-form';
import { StaffFormValues } from '../hooks/useStaffForm';

interface StaffActiveStatusProps {
  form: UseFormReturn<StaffFormValues>;
}

const StaffActiveStatus: React.FC<StaffActiveStatusProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="is_active"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Ativo</FormLabel>
            <FormDescription>
              Profissional disponível para agendamentos e exibição na equipe
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default StaffActiveStatus;
