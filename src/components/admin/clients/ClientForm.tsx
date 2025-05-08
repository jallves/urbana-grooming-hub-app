
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
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ClientFormProps {
  clientId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const clientFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }).nullable().optional(),
  phone: z.string().min(10, { message: 'Telefone inválido' }),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const ClientForm: React.FC<ClientFormProps> = ({ clientId, onCancel, onSuccess }) => {
  const isEditing = !!clientId;

  const { data: clientData, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
    values: clientData || undefined,
  });
  
  const { formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (values: ClientFormValues) => {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('clients')
          .update(values)
          .eq('id', clientId);

        if (error) throw error;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Ensure that the required fields are present in the object
        const clientData = {
          name: values.name,
          phone: values.phone,
          email: values.email || null,
        };

        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;
        toast.success('Cliente criado com sucesso!');
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar cliente', {
        description: (error as Error).message
      });
    }
  };

  if (isEditing && isLoadingClient) {
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
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="email@exemplo.com" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
