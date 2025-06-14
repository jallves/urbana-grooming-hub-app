
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import CashFlowForm from './CashFlowForm';

const CashFlowTransactions: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['cash-flow-transactions', searchTerm, typeFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('cash_flow')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (searchTerm) {
        query = query.ilike('description', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['cash-flow-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_flow_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_flow')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Transação excluída',
        description: 'A transação foi excluída com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      setDeletingTransaction(null);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir a transação.',
        variant: 'destructive',
      });
    },
  });

  const getPaymentMethodText = (method: string) => {
    const methods: Record<string, string> = {
      money: 'Dinheiro',
      debit: 'Cartão de Débito',
      credit: 'Cartão de Crédito',
      pix: 'PIX',
      transfer: 'Transferência',
      other: 'Outro'
    };
    return methods[method] || method;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-urbana-gold font-playfair">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={(value: 'all' | 'income' | 'expense') => setTypeFilter(value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setCategoryFilter('all');
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-urbana-gold font-playfair">
            Transações ({transactions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-48"></div>
                      <div className="h-3 bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${transaction.transaction_type === 'income' ? 'bg-green-900' : 'bg-red-900'}`}>
                        {transaction.transaction_type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-white">{transaction.description}</h3>
                          <Badge
                            variant="outline"
                            className={`text-xs ${transaction.transaction_type === 'income' ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}
                          >
                            {transaction.transaction_type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{transaction.category}</span>
                          {transaction.payment_method && (
                            <span>• {getPaymentMethodText(transaction.payment_method)}</span>
                          )}
                          <span>• {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        
                        {transaction.notes && (
                          <p className="text-sm text-gray-500 mt-2">{transaction.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${transaction.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTransaction(transaction)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-urbana-gold hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingTransaction(transaction)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Nenhuma transação encontrada</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'Adicione sua primeira transação para começar'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent className="bg-urbana-black border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-urbana-gold font-playfair">Editar Transação</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <CashFlowForm
              editingTransaction={editingTransaction}
              onSuccess={() => setEditingTransaction(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir a transação "{deletingTransaction?.description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingTransaction(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingTransaction && deleteMutation.mutate(deletingTransaction.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CashFlowTransactions;
