
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, DollarSign, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  payment_method: string;
  transaction_date: string;
  status: 'pending' | 'completed' | 'canceled';
  created_at: string;
}

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to ensure transaction_type is properly typed
      const typedData: Transaction[] = (data || []).map(item => ({
        ...item,
        transaction_type: item.transaction_type as 'income' | 'expense',
        status: item.status as 'pending' | 'completed' | 'canceled'
      }));
      
      setTransactions(typedData);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalIncome = transactions
    .filter(t => t.transaction_type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.transaction_type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      {/* Header com resumo */}
      <div className="p-2 sm:p-4 border-b border-gray-700 flex-shrink-0">
        {/* Métricas */}
        <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-3 sm:mb-4">
          <Card className="bg-green-900/20 border-green-700/30 p-1.5 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
              <div className="min-w-0">
                <p className="text-xs text-green-400">Receitas</p>
                <p className="text-xs sm:text-base font-bold text-green-400 truncate">
                  R$ {totalIncome.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-red-900/20 border-red-700/30 p-1.5 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
              <div className="min-w-0">
                <p className="text-xs text-red-400">Despesas</p>
                <p className="text-xs sm:text-base font-bold text-red-400 truncate">
                  R$ {totalExpense.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className={`${balance >= 0 ? 'bg-urbana-gold/20 border-urbana-gold/30' : 'bg-red-900/20 border-red-700/30'} p-1.5 sm:p-3`}>
            <div className="flex items-center gap-1 sm:gap-2">
              <DollarSign className={`h-3 w-3 sm:h-4 sm:w-4 ${balance >= 0 ? 'text-urbana-gold' : 'text-red-400'}`} />
              <div className="min-w-0">
                <p className={`text-xs ${balance >= 0 ? 'text-urbana-gold' : 'text-red-400'}`}>Saldo</p>
                <p className={`text-xs sm:text-base font-bold ${balance >= 0 ? 'text-urbana-gold' : 'text-red-400'} truncate`}>
                  R$ {balance.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-urbana-gold" />
            <Input
              placeholder="Buscar transações..."
              className="pl-8 sm:pl-10 bg-gray-700 border-urbana-gold/30 text-white placeholder:text-gray-400 focus:border-urbana-gold text-xs sm:text-sm h-8 sm:h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-32 bg-gray-700 border-urbana-gold/30 text-white h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 bg-gray-700 border-urbana-gold/30 text-white h-8 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completo</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de transações */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">Nenhuma transação encontrada</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
                  <div className="p-2 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className={`p-1.5 sm:p-2 rounded-full ${transaction.transaction_type === 'income' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                          {transaction.transaction_type === 'income' ? 
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" /> : 
                            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                          }
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-medium text-white text-xs sm:text-base truncate">
                              {transaction.description}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={`text-xs flex-shrink-0 ${
                                transaction.status === 'completed' ? 'border-green-600 text-green-400' :
                                transaction.status === 'pending' ? 'border-yellow-600 text-yellow-400' :
                                'border-red-600 text-red-400'
                              }`}
                            >
                              {transaction.status === 'completed' ? 'Completo' :
                               transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                            <span>{transaction.category}</span>
                            <span>{transaction.payment_method}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0 ml-2 sm:ml-3">
                        <p className={`font-bold text-xs sm:text-base ${
                          transaction.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
