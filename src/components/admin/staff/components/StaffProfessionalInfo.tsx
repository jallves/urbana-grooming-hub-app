
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { StaffFormValues } from '../hooks/useStaffForm';

interface StaffProfessionalInfoProps {
  form: UseFormReturn<StaffFormValues>;
}

const StaffProfessionalInfo: React.FC<StaffProfessionalInfoProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria Profissional</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="barber">Barbeiro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="attendant">Atendente</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Barbeiros aparecerão automaticamente no módulo de barbeiros
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="commission_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taxa de Comissão (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Ex: 60" 
                  {...field} 
                  value={field.value === null ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Porcentagem que o profissional recebe por serviço (aplicável para barbeiros)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Especialidades</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ex: barba, corte degradê, etc (separados por vírgula)" 
                  {...field} 
                  value={field.value || ''}
                  className="resize-none"
                />
              </FormControl>
              <FormDescription>
                Liste as especialidades separadas por vírgula
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default StaffProfessionalInfo;
