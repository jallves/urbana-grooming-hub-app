
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CashFlowTransactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['cash-flow-transactions', searchTerm, typeFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase.from('cash_flow').select('*').order('transaction_date', { ascending: false });

      if (searchTerm) {
        query = query.ilike('description', `%${searchTerm}%`);
      }
      if (typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Carregando transações...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters - Compact for mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-gray-100 text-sm h-9"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100 text-sm h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100 text-sm h-9">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="Serviços de Barbearia">Serviços</SelectItem>
            <SelectItem value="Venda de Produtos">Produtos</SelectItem>
            <SelectItem value="Comissões">Comissões</SelectItem>
            <SelectItem value="Aluguel">Aluguel</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-100 text-sm h-9">
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </div>

      {/* Transactions List - Mobile optimized */}
      <div className="flex-1 space-y-2 overflow-auto">
        {transactions && transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.transaction_type === 'income' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {transaction.transaction_type === 'income' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-100 text-sm truncate">
                          {transaction.description}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                            {transaction.category}
                          </span>
                          {transaction.payment_method && (
                            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                              {transaction.payment_method}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className={`font-bold text-sm sm:text-base ${
                          transaction.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    
                    {transaction.notes && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{transaction.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <DollarSign className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Nenhuma transação encontrada</h3>
            <p className="text-sm text-gray-400">Adicione sua primeira transação para começar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowTransactions;
