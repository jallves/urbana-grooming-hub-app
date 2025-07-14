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

  // Estilos para status
  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
    canceled: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  // Obter intervalo do mês
  const getMonthRange = (date: Date) => {
    return {
      start: startOfMonth(date),
      end: endOfMonth(date)
    };
  };

  // Buscar transações
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { start, end } = dateFilter ? getMonthRange(dateFilter) : getMonthRange(new Date());
      
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', start.toISOString())
        .lte('transaction_date', end.toISOString());
      
      if (typeFilter !== 'all') query = query.eq('transaction_type', typeFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      
      const { data, error } = await query.order('transaction_date', { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
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

  // Marcar como pago
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
      toast.error('Erro ao marcar transação como paga', {
        description: (error as Error).message
      });
    }
  };

  // Navegação entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (!dateFilter) return;
    setDateFilter(direction === 'prev' ? subMonths(dateFilter, 1) : addMonths(dateFilter, 1));
  };

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(search) ||
      transaction.category?.toLowerCase().includes(search) ||
      transaction.payment_method?.toLowerCase().includes(search)
    );
  });

  // Calcular totais
  const { totalIncome, totalExpense, balance } = filteredTransactions.reduce((acc, t) => {
    if (t.status === 'canceled') return acc;
    
    if (t.transaction_type === 'income') {
      acc.totalIncome += Number(t.amount);
    } else {
      acc.totalExpense += Number(t.amount);
    }
    
    acc.balance = acc.totalIncome - acc.totalExpense;
    return acc;
  }, { totalIncome: 0, totalExpense: 0, balance: 0 });

  return (
    <div className="h-full w-full p-0 sm:p-4 bg-gray-950 overflow-hidden">
      <Card className="h-full w-full bg-gray-900/80 border-gray-800 rounded-none sm:rounded-lg overflow-hidden">
        {/* Cabeçalho e Filtros */}
        <div className="p-3 sm:p-4 border-b border-gray-800">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { 
                title: 'Receitas', 
                value: totalIncome, 
                icon: ArrowUpCircle, 
                color: 'green' 
              },
              { 
                title: 'Despesas', 
                value: totalExpense, 
                icon: ArrowDownCircle, 
                color: 'red' 
              },
              { 
                title: 'Balanço', 
                value: balance, 
                color: balance >= 0 ? 'yellow' : 'red' 
              }
            ].map((item, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-r p-3 rounded-lg border ${
                  item.color === 'green' ? 'from-green-500/20 to-green-600/20 border-green-500/30' :
                  item.color === 'red' ? 'from-red-500/20 to-red-600/20 border-red-500/30' :
                  'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {item.icon && (
                    <item.icon className={`h-4 w-4 text-${item.color}-400`} />
                  )}
                  <h3 className={`text-xs font-medium text-${item.color}-300`}>
                    {item.title}
                  </h3>
                </div>
                <p className={`text-lg font-bold text-${item.color}-400`}>
                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar transações..."
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="hover:bg-gray-700">Todos</SelectItem>
                <SelectItem value="income" className="hover:bg-gray-700">Receitas</SelectItem>
                <SelectItem value="expense" className="hover:bg-gray-700">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="hover:bg-gray-700">Todos</SelectItem>
                <SelectItem value="pending" className="hover:bg-gray-700">Pendentes</SelectItem>
                <SelectItem value="completed" className="hover:bg-gray-700">Concluídos</SelectItem>
                <SelectItem value="canceled" className="hover:bg-gray-700">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex col-span-2 sm:col-span-1 gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700"
              >
                &lt;
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700"
                  >
                    {dateFilter ? format(dateFilter, "MMM/yy", { locale: ptBR }) : "Mês"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
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
                className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700"
              >
                &gt;
              </Button>
            </div>

            <Button 
              onClick={() => {
                setSelectedTransaction(null);
                setIsFormOpen(true);
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium col-span-2 sm:col-span-1"
            >
              <Plus className="mr-1 h-4 w-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="h-[calc(100%-180px)] overflow-auto">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-gray-800 z-10">
              <TableRow>
                <TableHead className="w-[80px]">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="w-[80px]">Tipo</TableHead>
                <TableHead className="text-right w-[100px]">Valor</TableHead>
                <TableHead className="hidden md:table-cell w-[80px]">Status</TableHead>
                <TableHead className="text-right w-[60px]">Ações</TableHead>
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
                  <TableRow key={transaction.id} className="hover:bg-gray-800/50">
                    <TableCell className="font-medium">
                      {format(new Date(transaction.transaction_date), 'dd/MM')}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[120px] truncate">
                      {transaction.category || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          transaction.transaction_type === 'income' 
                            ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }
                      >
                        {transaction.transaction_type === 'income' ? 'Rec.' : 'Desp.'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right ${
                      transaction.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      R$ {Number(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={`${statusStyles[transaction.status]}`}>
                        {transaction.status === 'pending' && 'Pend.'}
                        {transaction.status === 'completed' && 'Pago'}
                        {transaction.status === 'canceled' && 'Canc.'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700 w-40">
                          {transaction.status === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => handleMarkAsPaid(transaction.id)}
                              className="text-green-400 hover:bg-gray-700"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedTransaction(transaction.id);
                              setIsFormOpen(true);
                            }}
                            className="hover:bg-gray-700"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setTransactionToDelete(transaction.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:bg-gray-700"
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

      {/* Modal de Formulário */}
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

      {/* Modal de Confirmação */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (!transactionToDelete) return;
                try {
                  await supabase
                    .from('financial_transactions')
                    .delete()
                    .eq('id', transactionToDelete);
                  setTransactions(transactions.filter(t => t.id !== transactionToDelete));
                  toast.success('Transação excluída com sucesso!');
                } catch (error) {
                  toast.error('Erro ao excluir transação');
                } finally {
                  setIsDeleteDialogOpen(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
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