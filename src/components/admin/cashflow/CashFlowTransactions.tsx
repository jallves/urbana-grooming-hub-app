
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CashFlowTransactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
          <Input
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-300 text-gray-900 text-sm h-9"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-white border-gray-300 text-gray-900 text-sm h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-300">
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-white border-gray-300 text-gray-900 text-sm h-9">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-300">
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="services">Serviços</SelectItem>
            <SelectItem value="products">Produtos</SelectItem>
            <SelectItem value="commissions">Comissões</SelectItem>
            <SelectItem value="expenses">Despesas Gerais</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          className="bg-white border-gray-300 hover:bg-gray-50 text-gray-900 text-sm h-9"
          onClick={clearFilters}
        >
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Limpar Filtros</span>
          <span className="sm:hidden">Limpar</span>
        </Button>
      </div>

      {/* Transactions List - Mobile optimized */}
      <div className="flex-1 space-y-2 overflow-auto">
        {transactions && transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.transaction_type === 'income' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
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
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {transaction.description}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                            {transaction.category}
                          </span>
                          {transaction.payment_method && (
                            <span className="text-xs text-gray-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                              {transaction.payment_method}
                            </span>
                          )}
                          {transaction.reference_type && (
                            <span className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                              📋 Origem: {transaction.reference_type === 'financial_record' ? 'Contas a Receber/Pagar' : transaction.reference_type}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className={`font-bold text-sm sm:text-base ${
                          transaction.transaction_type === 'income' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(transaction.transaction_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    
                    {transaction.notes && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2 bg-gray-50 p-2 rounded border border-gray-200">{transaction.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-gray-50 rounded-lg border border-gray-200">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma transação encontrada</h3>
            <p className="text-sm text-gray-600">As transações aparecerão aqui quando você marcar contas como pagas/recebidas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowTransactions;
