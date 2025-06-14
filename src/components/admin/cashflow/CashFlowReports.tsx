
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CashFlowReports: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['cash-flow-reports', period, selectedMonth],
    queryFn: async () => {
      let start: Date, end: Date;
      
      if (period === 'week') {
        const date = new Date();
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
      } else if (period === 'month') {
        const date = new Date(selectedMonth + '-01');
        start = startOfMonth(date);
        end = endOfMonth(date);
      } else {
        const date = new Date(selectedMonth + '-01');
        start = startOfYear(date);
        end = endOfYear(date);
      }

      const { data, error } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'));

      if (error) throw error;

      const transactions = data || [];
      
      // Calcular totais
      const income = transactions.filter(t => t.transaction_type === 'income');
      const expenses = transactions.filter(t => t.transaction_type === 'expense');
      
      const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Agrupar por categoria
      const incomeByCategory: Record<string, number> = {};
      const expenseByCategory: Record<string, number> = {};
      
      income.forEach(t => {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + Number(t.amount);
      });
      
      expenses.forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
      });

      // Agrupar por método de pagamento
      const paymentMethods: Record<string, number> = {};
      transactions.forEach(t => {
        if (t.payment_method) {
          paymentMethods[t.payment_method] = (paymentMethods[t.payment_method] || 0) + Number(t.amount);
        }
      });

      return {
        period: {
          start: format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          end: format(end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        },
        totals: {
          income: totalIncome,
          expense: totalExpense,
          net: totalIncome - totalExpense,
          transactionCount: transactions.length,
        },
        categories: {
          income: Object.entries(incomeByCategory).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
          expense: Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
        },
        paymentMethods: Object.entries(paymentMethods).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
        transactions,
      };
    },
  });

  const generateCSV = () => {
    if (!reportData) return;

    const csvContent = [
      ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Método de Pagamento', 'Observações'].join(','),
      ...reportData.transactions.map(t => [
        format(new Date(t.transaction_date), 'dd/MM/yyyy'),
        t.transaction_type === 'income' ? 'Receita' : 'Despesa',
        `"${t.description}"`,
        `"${t.category}"`,
        Number(t.amount).toFixed(2),
        t.payment_method || '',
        `"${t.notes || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluxo-caixa-${period}-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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

  // Gerar opções de mês
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    monthOptions.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR })
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles do Relatório */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-urbana-gold font-playfair">Configurações do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Período</label>
              <Select value={period} onValueChange={(value: 'week' | 'month' | 'year') => setPeriod(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Mensal</SelectItem>
                  <SelectItem value="year">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period !== 'week' && (
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Mês/Ano</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={generateCSV}
              className="bg-gradient-to-r from-urbana-gold to-urbana-gold/80 hover:from-urbana-gold/90 hover:to-urbana-gold text-urbana-black font-semibold"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Resumo do Período */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-urbana-gold font-playfair flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Resumo - {reportData.period.start} a {reportData.period.end}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-700/50">
                  <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm mb-1">Total de Receitas</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {reportData.totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-700/50">
                  <TrendingDown className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 text-sm mb-1">Total de Despesas</p>
                  <p className="text-2xl font-bold text-red-400">
                    R$ {reportData.totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className={`text-center p-4 rounded-lg border ${reportData.totals.net >= 0 ? 'bg-urbana-gold/20 border-urbana-gold/50' : 'bg-red-900/20 border-red-700/50'}`}>
                  <DollarSign className={`h-8 w-8 mx-auto mb-2 ${reportData.totals.net >= 0 ? 'text-urbana-gold' : 'text-red-400'}`} />
                  <p className={`text-sm mb-1 ${reportData.totals.net >= 0 ? 'text-urbana-gold' : 'text-red-400'}`}>Saldo Líquido</p>
                  <p className={`text-2xl font-bold ${reportData.totals.net >= 0 ? 'text-urbana-gold' : 'text-red-400'}`}>
                    R$ {reportData.totals.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-1">Total de Transações</p>
                  <p className="text-2xl font-bold text-white">
                    {reportData.totals.transactionCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receitas por Categoria */}
          {reportData.categories.income.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-urbana-gold font-playfair">Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.categories.income.map((category, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-green-900/10 rounded-lg border border-green-700/30">
                      <span className="text-white font-medium">{category.name}</span>
                      <span className="text-green-400 font-bold">
                        R$ {category.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Despesas por Categoria */}
          {reportData.categories.expense.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-urbana-gold font-playfair">Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.categories.expense.map((category, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-900/10 rounded-lg border border-red-700/30">
                      <span className="text-white font-medium">{category.name}</span>
                      <span className="text-red-400 font-bold">
                        R$ {category.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métodos de Pagamento */}
          {reportData.paymentMethods.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-urbana-gold font-playfair">Métodos de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.paymentMethods.map((method, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <span className="text-white font-medium">{getPaymentMethodText(method.name)}</span>
                      <span className="text-urbana-gold font-bold">
                        R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CashFlowReports;
