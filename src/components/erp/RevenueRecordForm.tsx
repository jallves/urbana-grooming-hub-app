import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  transaction_type: z.enum(['revenue']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional(),
  gross_amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  discount_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  description: z.string().min(1, 'Descrição é obrigatória'),
  transaction_date: z.date(),
  status: z.enum(['pending', 'completed', 'cancelled']),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RevenueRecordFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  initialData?: Partial<FormValues> & { id?: string };
  isLoading?: boolean;
}

const RevenueRecordForm: React.FC<RevenueRecordFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transaction_type: 'revenue',
      category: '',
      subcategory: '',
      gross_amount: undefined,
      discount_amount: 0,
      tax_amount: 0,
      description: '',
      transaction_date: new Date(),
      status: 'pending',
      payment_method: '',
      notes: '',
    },
  });

  // Reset form quando initialData mudar (edição)
  useEffect(() => {
    if (open && initialData) {
      form.reset({
        transaction_type: 'revenue',
        category: initialData.category || '',
        subcategory: initialData.subcategory || '',
        gross_amount: initialData.gross_amount || undefined,
        discount_amount: initialData.discount_amount || 0,
        tax_amount: initialData.tax_amount || 0,
        description: initialData.description || '',
        transaction_date: initialData.transaction_date || new Date(),
        status: initialData.status || 'pending',
        payment_method: initialData.payment_method || '',
        notes: initialData.notes || '',
      });
    } else if (open && !initialData) {
      // Reset para valores padrão quando for novo registro
      form.reset({
        transaction_type: 'revenue',
        category: '',
        subcategory: '',
        gross_amount: undefined,
        discount_amount: 0,
        tax_amount: 0,
        description: '',
        transaction_date: new Date(),
        status: 'pending',
        payment_method: '',
        notes: '',
      });
    }
  }, [open, initialData, form]);

  const grossAmount = form.watch('gross_amount') || 0;
  const discountAmount = form.watch('discount_amount') || 0;
  const taxAmount = form.watch('tax_amount') || 0;
  const netAmount = grossAmount - discountAmount - taxAmount;

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
  };

  const categories = [
    { value: 'services', label: 'Serviços' },
    { value: 'products', label: 'Produtos' },
    { value: 'other', label: 'Outros' },
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Dinheiro' },
    { value: 'debit', label: 'Cartão de Débito' },
    { value: 'credit', label: 'Cartão de Crédito' },
    { value: 'pix', label: 'PIX' },
    { value: 'transfer', label: 'Transferência' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl">
            {initialData?.id ? 'Editar Receita' : 'Nova Receita'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descrição da receita" className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="gross_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Valor Bruto</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        className="h-9 text-sm"
                        value={field.value ? `R$ ${field.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                          const numValue = parseFloat(value);
                          field.onChange(isNaN(numValue) ? undefined : numValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Desconto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Impostos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-9 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-2 sm:p-3 bg-muted rounded-md">
              <p className="text-xs sm:text-sm font-medium">
                Valor Líquido: R$ {netAmount.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm">Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="justify-start text-left font-normal h-9 text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : 'Selecione'}
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

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Observações adicionais" className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Salvando...' : initialData?.id ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RevenueRecordForm;
