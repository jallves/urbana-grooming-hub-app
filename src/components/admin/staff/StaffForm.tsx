
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface StaffFormProps {
  staffId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const staffFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }).nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

const StaffForm: React.FC<StaffFormProps> = ({ staffId, onCancel, onSuccess }) => {
  const isEditing = !!staffId;

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: async () => {
      if (!staffId) return null;
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: '',
      is_active: true,
    },
    values: staffData || undefined,
  });
  
  const { formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (values: StaffFormValues) => {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('staff')
          .update(values)
          .eq('id', staffId);

        if (error) throw error;
        toast.success('Profissional atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([values]);

        if (error) throw error;
        toast.success('Profissional criado com sucesso!');
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar profissional', {
        description: (error as Error).message
      });
    }
  };

  if (isEditing && isLoadingStaff) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do profissional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input placeholder="E-mail do profissional" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="Telefone do profissional" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativo</FormLabel>
                <FormDescription>
                  Profissional disponível para agendamentos
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
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Profissional'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StaffForm;
