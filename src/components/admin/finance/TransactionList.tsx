
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Badge
} from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash2, Search, Plus, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react';
import FinancialTransactionForm from './FinancialTransactionForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { FinancialTransaction } from '@/types/financial';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Transaction status and type styling
  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    canceled: 'bg-red-100 text-red-800',
  };

  const getMonthRange = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return { start, end };
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);

      const { start, end } = dateFilter ? getMonthRange(dateFilter) : getMonthRange(new Date());
      
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', start.toISOString())
        .lte('transaction_date', end.toISOString());
      
      if (typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('transaction_date', { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações', {
        description: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTransactions();
  }, [dateFilter, typeFilter, statusFilter]);
  
  const handleCreateTransaction = () => {
    setSelectedTransaction(null);
    setIsFormOpen(true);
  };

  const handleEditTransaction = (transactionId: string) => {
    setSelectedTransaction(transactionId);
    setIsFormOpen(true);
  };

  const confirmDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionToDelete);

      if (error) throw error;

      setTransactions(transactions.filter(transaction => transaction.id !== transactionToDelete));
      toast.success('Transação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação', {
        description: (error as Error).message
      });
    } finally {
      setTransactionToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (!dateFilter) return;
    
    if (direction === 'prev') {
      setDateFilter(subMonths(dateFilter, 1));
    } else {
      setDateFilter(addMonths(dateFilter, 1));
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (searchQuery === '') return true;
    
    return (
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.payment_method?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calculate totals
  const calculateTotals = () => {
    const totalIncome = filteredTransactions
      .filter(t => t.transaction_type === 'income' && t.status !== 'canceled')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const totalExpense = filteredTransactions
      .filter(t => t.transaction_type === 'expense' && t.status !== 'canceled')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const balance = totalIncome - totalExpense;
    
    return { totalIncome, totalExpense, balance };
  };

  const { totalIncome, totalExpense, balance } = calculateTotals();

  return (
    <>
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-medium text-green-800">Total de Receitas</h3>
            </div>
            <p className="mt-2 text-2xl font-bold text-green-700">
              R$ {totalIncome.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-800">Total de Despesas</h3>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-700">
              R$ {totalExpense.toFixed(2)}
            </p>
          </div>
          
          <div className={`${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} p-4 rounded-lg border`}>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-medium ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                Balanço
              </h3>
            </div>
            <p className={`mt-2 text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                &lt;
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px]">
                    {dateFilter ? format(dateFilter, "MMMM 'de' yyyy", { locale: ptBR }) : 
                      "Selecione o mês"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                &gt;
              </Button>
            </div>
            
            <Button onClick={handleCreateTransaction}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Carregando transações...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Nenhuma transação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell>
                      {transaction.category || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={transaction.transaction_type === 'income' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                        }
                      >
                        {transaction.transaction_type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {Number(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[transaction.status]}>
                        {transaction.status === 'pending' && 'Pendente'}
                        {transaction.status === 'completed' && 'Concluído'}
                        {transaction.status === 'canceled' && 'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTransaction(transaction.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => confirmDeleteTransaction(transaction.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {isFormOpen && (
        <FinancialTransactionForm
          transactionId={selectedTransaction}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchTransactions();
          }}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTransaction}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TransactionList;

