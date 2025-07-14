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
import { Badge } from "@/components/ui/badge";
import { Edit, MoreHorizontal, Trash2, Search, Plus, ArrowUpCircle, ArrowDownCircle, CheckCircle } from 'lucide-react';
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
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
    canceled: 'bg-red-500/20 text-red-300 border-red-500/30',
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

  const handleMarkAsPaid = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          status: 'completed',
          payment_date: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(transactions.map(t => 
        t.id === transactionId ? { ...t, status: 'completed', payment_date: new Date().toISOString() } : t
      ));
      
      toast.success('Transação marcada como paga!');
    } catch (error) {
      console.error('Erro ao marcar transação como paga:', error);
      toast.error('Erro ao marcar transação como paga', {
        description: (error as Error).message
      });
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
    <div className="space-y-3 sm:space-y-4 w-full">
      <Card className="p-3 sm:p-4 bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-lg border border-white/10">
        {/* Cards de resumo responsivos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 p-3 sm:p-4 rounded-lg border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              <h3 className="text-xs sm:text-sm font-medium text-green-300">Receitas</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-400">
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-3 sm:p-4 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
              <h3 className="text-xs sm:text-sm font-medium text-red-300">Despesas</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-red-400">
              R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className={`bg-gradient-to-r ${balance >= 0 ? 'from-urbana-gold/20 to-yellow-500/20 border-urbana-gold/30' : 'from-red-500/20 to-red-600/20 border-red-500/30'} p-3 sm:p-4 rounded-lg border`}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-xs sm:text-sm font-medium ${balance >= 0 ? 'text-urbana-gold' : 'text-red-300'}`}>
                Balanço
              </h3>
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${balance >= 0 ? 'text-urbana-gold' : 'text-red-400'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Filtros responsivos */}
        <div className="space-y-3 mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar transações..."
              className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-700">Todos os tipos</SelectItem>
                <SelectItem value="income" className="text-white hover:bg-gray-700">Receitas</SelectItem>
                <SelectItem value="expense" className="text-white hover:bg-gray-700">Despesas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-700">Todos os status</SelectItem>
                <SelectItem value="pending" className="text-white hover:bg-gray-700">Pendentes</SelectItem>
                <SelectItem value="completed" className="text-white hover:bg-gray-700">Concluídos</SelectItem>
                <SelectItem value="canceled" className="text-white hover:bg-gray-700">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700 text-xs px-2"
              >
                &lt;
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700 text-xs">
                    {dateFilter ? format(dateFilter, "MMM/yy", { locale: ptBR }) : "Mês"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('next')}
                className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700 text-xs px-2"
              >
                &gt;
              </Button>
            </div>
            
            <Button onClick={handleCreateTransaction} className="bg-gradient-to-r from-urbana-gold to-urbana-gold/80 hover:from-urbana-gold/90 hover:to-urbana-gold text-black font-semibold text-xs">
              <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nova</span> Transação
            </Button>
          </div>
        </div>

        {/* Tabela responsiva com scroll horizontal */}
        <div className="rounded-md border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Data</TableHead>
                  <TableHead className="min-w-[120px]">Descrição</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="min-w-[80px]">Tipo</TableHead>
                  <TableHead className="text-right min-w-[100px]">Valor</TableHead>
                  <TableHead className="min-w-[80px] hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right min-w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      Carregando transações...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-white">
                        {format(new Date(transaction.transaction_date), 'dd/MM')}
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="max-w-[120px] truncate">
                          {transaction.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-white hidden sm:table-cell">
                        <div className="max-w-[100px] truncate">
                          {transaction.category || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={transaction.transaction_type === 'income' 
                            ? 'bg-green-500/20 text-green-300 border-green-500/30 text-xs' 
                            : 'bg-red-500/20 text-red-300 border-red-500/30 text-xs'
                          }
                        >
                          {transaction.transaction_type === 'income' ? 'Rec.' : 'Desp.'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium text-sm ${
                        transaction.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        R$ {Number(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={`${statusStyles[transaction.status]} text-xs`}>
                          {transaction.status === 'pending' && 'Pend.'}
                          {transaction.status === 'completed' && 'Ok'}
                          {transaction.status === 'canceled' && 'Canc.'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/10">
                              <MoreHorizontal className="h-3 w-3" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                            {transaction.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => handleMarkAsPaid(transaction.id)} 
                                className="text-green-400 hover:bg-gray-700 text-xs"
                              >
                                <CheckCircle className="mr-2 h-3 w-3" />
                                Marcar como pago
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleEditTransaction(transaction.id)} 
                              className="text-white hover:bg-gray-700 text-xs"
                            >
                              <Edit className="mr-2 h-3 w-3" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => confirmDeleteTransaction(transaction.id)}
                              className="text-red-400 hover:bg-gray-700 text-xs"
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
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
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir transação</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTransaction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TransactionList;