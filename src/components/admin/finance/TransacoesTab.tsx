
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface Transaction {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
  barbeiro_id?: string;
  staff?: { name: string };
}

const TransacoesTab: React.FC<TransacoesTabProps> = ({ filters }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    tipo: 'receita' as 'receita' | 'despesa',
    categoria: '',
    descricao: '',
    valor: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    status: 'pago'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['all-transactions', filters],
    queryFn: async () => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      let query = supabase
        .from('finance_transactions')
        .select(`
          *,
          staff:barbeiro_id(name)
        `)
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'))
        .order('data', { ascending: false });

      if (filters.tipo !== 'todos') {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters.barbeiro !== 'todos') {
        query = query.eq('barbeiro_id', filters.barbeiro);
      }

      const { data } = await query;
      return data as Transaction[] || [];
    }
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .insert([transaction])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      setIsDialogOpen(false);
      setNewTransaction({
        tipo: 'receita',
        categoria: '',
        descricao: '',
        valor: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        status: 'pago'
      });
      toast({
        title: 'Transação criada',
        description: 'A transação foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a transação.',
        variant: 'destructive',
      });
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Transação excluída',
        description: 'A transação foi excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a transação.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransaction.descricao || !newTransaction.valor || !newTransaction.categoria) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    createTransactionMutation.mutate({
      ...newTransaction,
      valor: parseFloat(newTransaction.valor.replace(',', '.'))
    });
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
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Todas as Transações</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Nova Transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo" className="text-white">Tipo</Label>
                    <Select
                      value={newTransaction.tipo}
                      onValueChange={(value: 'receita' | 'despesa') => 
                        setNewTransaction({ ...newTransaction, tipo: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="categoria" className="text-white">Categoria</Label>
                    <Input
                      id="categoria"
                      value={newTransaction.categoria}
                      onChange={(e) => setNewTransaction({ ...newTransaction, categoria: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Ex: água, luz, produto"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao" className="text-white">Descrição</Label>
                  <Input
                    id="descricao"
                    value={newTransaction.descricao}
                    onChange={(e) => setNewTransaction({ ...newTransaction, descricao: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Descrição da transação"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor" className="text-white">Valor</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={newTransaction.valor}
                      onChange={(e) => setNewTransaction({ ...newTransaction, valor: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="data" className="text-white">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={newTransaction.data}
                      onChange={(e) => setNewTransaction({ ...newTransaction, data: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTransactionMutation.isPending}>
                    {createTransactionMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhuma transação encontrada para o período selecionado.
              </div>
            ) : (
              transactions?.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.tipo === 'receita' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {transaction.tipo === 'receita' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{transaction.descricao}</p>
                      <p className="text-sm text-gray-400">
                        {transaction.categoria} • {format(new Date(transaction.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.tipo === 'receita' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {transaction.tipo === 'receita' ? '+' : '-'}R$ {Number(transaction.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={transaction.status === 'pago' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-500 hover:text-red-400"
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
