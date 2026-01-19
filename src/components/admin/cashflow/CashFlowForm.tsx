
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { CashFlowFormData } from '@/types/cashflow';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashFlowFormProps {
  onSuccess?: () => void;
  editingTransaction?: any;
}

const CashFlowForm: React.FC<CashFlowFormProps> = ({ onSuccess, editingTransaction }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CashFlowFormData>({
    transaction_type: editingTransaction?.transaction_type || 'income',
    amount: editingTransaction?.amount || 0,
    description: editingTransaction?.description || '',
    category: editingTransaction?.category || '',
    payment_method: editingTransaction?.payment_method || '',
    transaction_date: editingTransaction ? new Date(editingTransaction.transaction_date) : new Date(),
    notes: editingTransaction?.notes || '',
  });

  const { data: categories } = useQuery({
    queryKey: ['cash-flow-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_flow_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CashFlowFormData) => {
      const payload = {
        ...data,
        transaction_date: format(data.transaction_date, 'yyyy-MM-dd'),
      };

      if (editingTransaction) {
        const { data: result, error } = await supabase
          .from('cash_flow')
          .update(payload)
          .eq('id', editingTransaction.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('cash_flow')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast({
        title: editingTransaction ? 'Transação atualizada' : 'Transação criada',
        description: editingTransaction ? 'A transação foi atualizada com sucesso.' : 'A transação foi criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow-current-month'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a transação.',
        variant: 'destructive',
      });
      console.error('Error saving transaction:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const filteredCategories = categories?.filter(cat => 
    cat.type === formData.transaction_type || cat.type === 'both'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700 text-sm">Tipo de Transação</Label>
          <Select 
            value={formData.transaction_type} 
            onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, transaction_type: value, category: '' })}
          >
            <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="income" className="text-green-700">
                Receita
              </SelectItem>
              <SelectItem value="expense" className="text-red-700">
                Despesa
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 text-sm">Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            className="bg-white border-gray-300 text-gray-900 h-9 text-sm"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700 text-sm">Descrição</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-white border-gray-300 text-gray-900 h-9 text-sm"
          placeholder="Ex: Corte de cabelo - João Silva"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700 text-sm">Categoria</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-9 text-sm">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              {filteredCategories?.filter(category => category.name && category.name.trim() !== '').map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 text-sm">Método de Pagamento</Label>
          <Select 
            value={formData.payment_method || ''} 
            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
          >
            <SelectTrigger className="bg-white border-gray-300 text-gray-900 h-9 text-sm">
              <SelectValue placeholder="Selecione o método" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              <SelectItem value="money">Dinheiro</SelectItem>
              <SelectItem value="debit">Cartão de Débito</SelectItem>
              <SelectItem value="credit">Cartão de Crédito</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="transfer">Transferência</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700 text-sm">Data da Transação</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-900 hover:bg-gray-50 h-9 text-sm"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.transaction_date ? format(formData.transaction_date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border-gray-300">
            <Calendar
              mode="single"
              selected={formData.transaction_date}
              onSelect={(date) => date && setFormData({ ...formData, transaction_date: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700 text-sm">Observações (opcional)</Label>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="bg-white border-gray-300 text-gray-900 text-sm"
          placeholder="Informações adicionais sobre a transação..."
          rows={3}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto"
        >
          {mutation.isPending ? 'Salvando...' : editingTransaction ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};

export default CashFlowForm;
