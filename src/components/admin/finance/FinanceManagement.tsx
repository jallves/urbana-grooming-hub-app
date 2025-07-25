
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CaixaTab from './CaixaTab';
import TransacoesTab from './TransacoesTab';
import ComissoesTab from './ComissoesTab';
import RelatoriosTab from './RelatoriosTab';
import FiltrosFinanceiros from './FiltrosFinanceiros';

interface FinancialSummary {
  receitaTotal: number;
  despesaTotal: number;
  comissaoTotal: number;
  lucroLiquido: number;
  margem: number;
}

const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('caixa');
  const [filters, setFilters] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    tipo: 'todos',
    barbeiro: 'todos'
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: ['financial-summary', filters],
    queryFn: async (): Promise<FinancialSummary> => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      // Buscar todas as transações do período
      const { data: transactions } = await supabase
        .from('finance_transactions')
        .select('*')
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'));

      // Calcular totais
      const receitas = transactions?.filter(t => t.tipo === 'receita') || [];
      const despesas = transactions?.filter(t => t.tipo === 'despesa') || [];
      const comissoes = despesas.filter(d => d.categoria === 'comissao') || [];

      const receitaTotal = receitas.reduce((sum, t) => sum + Number(t.valor), 0);
      const despesaTotal = despesas.reduce((sum, t) => sum + Number(t.valor), 0);
      const comissaoTotal = comissoes.reduce((sum, t) => sum + Number(t.valor), 0);
      const lucroLiquido = receitaTotal - despesaTotal;
      const margem = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

      return {
        receitaTotal,
        despesaTotal,
        comissaoTotal,
        lucroLiquido,
        margem
      };
    }
  });

  const summaryCards = [
    {
      title: 'Receita Total',
      value: `R$ ${summary?.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Despesas',
      value: `R$ ${summary?.despesaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Comissões',
      value: `R$ ${summary?.comissaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: Calculator,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Lucro Líquido',
      value: `R$ ${summary?.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: TrendingUp,
      color: summary?.lucroLiquido >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: summary?.lucroLiquido >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <FiltrosFinanceiros 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              {card.title === 'Lucro Líquido' && summary && (
                <p className={`text-xs ${summary.margem >= 20 ? 'text-green-500' : 'text-red-500'}`}>
                  Margem: {summary.margem.toFixed(1)}%
                  {summary.margem < 20 && ' ⚠️'}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs do Módulo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger 
            value="caixa" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Caixa
          </TabsTrigger>
          <TabsTrigger 
            value="transacoes"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Transações
          </TabsTrigger>
          <TabsTrigger 
            value="comissoes"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Comissões
          </TabsTrigger>
          <TabsTrigger 
            value="relatorios"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="caixa" className="mt-6">
          <CaixaTab filters={filters} />
        </TabsContent>

        <TabsContent value="transacoes" className="mt-6">
          <TransacoesTab filters={filters} />
        </TabsContent>

        <TabsContent value="comissoes" className="mt-6">
          <ComissoesTab filters={filters} />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <RelatoriosTab filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManagement;
