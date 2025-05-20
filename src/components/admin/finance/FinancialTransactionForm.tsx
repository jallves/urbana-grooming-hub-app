
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface FinancialTransactionFormProps {
  transactionId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const transactionCategories = {
  income: [
    { value: 'service', label: 'Serviço' },
    { value: 'product', label: 'Produto' },
    { value: 'other_income', label: 'Outros' },
  ],
  expense: [
    { value: 'rent', label: 'Aluguel' },
    { value: 'utilities', label: 'Contas (Água/Luz/etc)' },
    { value: 'supplies', label: 'Suprimentos' },
    { value: 'equipment', label: 'Equipamentos' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'staff_payment', label: 'Pagamento de Funcionários' },
    { value: 'other_expense', label: 'Outros' },
  ]
};

const transactionSchema = z.object({
  transaction_type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive({ message: 'O valor deve ser maior que zero' }),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  status: z.enum(['pending', 'completed', 'canceled']),
  transaction_date: z.date(),
  appointment_id: z.string().nullable().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const FinancialTransactionForm: React.FC<FinancialTransactionFormProps> = ({ 
  transactionId, 
  onClose, 
  onSuccess 
}) => {
  const isEditing = !!transactionId;

  const { data: transactionData, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      if (!transactionId) return null;
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
      
      if (error) throw new Error(error.message);
      
      // Parse and convert the data to match our form schema
      return {
        ...data,
        transaction_type: data.transaction_type as 'income' | 'expense',
        status: data.status as 'pending' | 'completed' | 'canceled',
        transaction_date: new Date(data.transaction_date),
      };
    },
    enabled: isEditing,
  });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_type: 'income',
      amount: 0,
      description: '',
      category: '',
      payment_method: '',
      status: 'pending',
      transaction_date: new Date(),
      appointment_id: null,
    },
    values: transactionData || undefined,
  });
  
  const transactionType = form.watch('transaction_type');
  const { formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const transactionData = {
        transaction_type: values.transaction_type,
        amount: values.amount,
        description: values.description || null,
        category: values.category || null,
        payment_method: values.payment_method || null,
        status: values.status,
        transaction_date: values.transaction_date.toISOString(),
        appointment_id: values.appointment_id || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('financial_transactions')
          .update(transactionData)
          .eq('id', transactionId);

        if (error) throw error;
        toast.success('Transação atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('financial_transactions')
          .insert([transactionData]);

        if (error) throw error;
        toast.success('Transação criada com sucesso!');
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Erro ao salvar transação', {
        description: (error as Error).message
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>

        {isEditing && isLoadingTransaction ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="transaction_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionType === 'income'
                          ? transactionCategories.income.map(category => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))
                          : transactionCategories.expense.map(category => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição da transação" 
                        className="resize-none"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinancialTransactionForm;

