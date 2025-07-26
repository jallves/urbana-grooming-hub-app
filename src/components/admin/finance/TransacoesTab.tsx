
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ArrowUpRight, ArrowDownRight, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransacoesTabProps {
  filters: {
    mes: number;
    ano: number;
    tipo: string;
    barbeiro: string;
  };
}

interface CashFlowTransaction {
  id: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  payment_method?: string;
  notes?: string;
  transaction_date: string;
  created_at: string;
}

const TransacoesTab: React.FC<TransacoesTabProps> = ({ filters }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashFlowTransaction | null>(null);
  const [formData, setFormData] = useState({
    transaction_type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    payment_method: '',
    notes: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: categories } = useQuery({
    queryKey: ['cash-flow-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cash_flow_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      return data || [];
    }
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['cash-flow-transactions', filters],
    queryFn: async () => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      let query = supabase
        .from('cash_flow')
        .select('*')
        .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endDate, 'yyyy-MM-dd'))
        .order('transaction_date', { ascending: false });

      if (filters.tipo !== 'todos') {
        const tipo = filters.tipo === 'receita' ? 'income' : 'expense';
        query = query.eq('transaction_type', tipo);
      }

      const { data } = await query;
      return data as CashFlowTransaction[] || [];
    }
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('cash_flow')
        .insert({
          transaction_type: data.transaction_type,
          amount: parseFloat(data.amount),
          description: data.description,
          category: data.category,
          payment_method: data.payment_method || null,
          notes: data.notes || null,
          transaction_date: data.transaction_date
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Transação criada',
        description: 'A transação foi registrada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar transação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a transação.',
        variant: 'destructive',
      });
    }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from('cash_flow')
        .update({
          transaction_type: data.transaction_type,
          amount: parseFloat(data.amount),
          description: data.description,
          category: data.category,
          payment_method: data.payment_method || null,
          notes: data.notes || null,
          transaction_date: data.transaction_date
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setIsDialogOpen(false);
      setEditingTransaction(null);
      resetForm();
      toast({
        title: 'Transação atualizada',
        description: 'A transação foi atualizada com sucesso.',
      });
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_flow')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Transação excluída',
        description: 'A transação foi excluída com sucesso.',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      transaction_type: 'expense',
      amount: '',
      description: '',
      category: '',
      payment_method: '',
      notes: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (editingTransaction) {
      updateTransactionMutation.mutate({ ...formData, id: editingTransaction.id });
    } else {
      createTransactionMutation.mutate(formData);
    }
  };

  const openEditDialog = (transaction: CashFlowTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transaction_type: transaction.transaction_type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      payment_method: transaction.payment_method || '',
      notes: transaction.notes || '',
      transaction_date: transaction.transaction_date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de nova transação */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Transações Manuais</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
              setEditingTransaction(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Tipo *</label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value) => setFormData({ ...formData, transaction_type: value as 'income' | 'expense' })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Valor *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Descrição *</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Descrição da transação"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Categoria *</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.filter(c => c.type === formData.transaction_type).map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Forma de Pagamento</label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Data *</label>
                  <Input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Observações</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-600 text-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {editingTransaction ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Transações */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma transação manual encontrada para o período selecionado.
              </div>
            ) : (
              transactions?.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.transaction_type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {transaction.transaction_type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-400">
                        {transaction.category} • {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      {transaction.payment_method && (
                        <p className="text-xs text-gray-500">Via: {transaction.payment_method}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.transaction_type === 'income' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Manual
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(transaction)}
                        className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(transaction.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransacoesTab;
