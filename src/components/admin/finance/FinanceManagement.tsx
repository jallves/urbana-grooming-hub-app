
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CaixaTab from './CaixaTab';
import TransacoesTab from './TransacoesTab';
import ComissoesTab from './ComissoesTab';
import RelatoriosTab from './RelatoriosTab';
import FiltrosFinanceiros from './FiltrosFinanceiros';
import { useRealtime } from '@/contexts/RealtimeContext';

interface FinancialSummary {
  receitaTotal: number;
  despesaTotal: number;
  comissaoTotal: number;
  comissaoPendente: number;
  lucroLiquido: number;
  margem: number;
}

const FinanceManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshFinancials } = useRealtime();
  const [activeTab, setActiveTab] = useState('caixa');
  const [filters, setFilters] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    tipo: 'todos',
    barbeiro: 'todos'
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
  }, [refreshFinancials, queryClient]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['financial-summary', filters],
    queryFn: async (): Promise<FinancialSummary> => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      // Buscar receitas do painel de agendamentos concluídos
      const { data: agendamentos } = await supabase
        .from('painel_agendamentos')
        .select(`
          *,
          painel_servicos!inner(preco)
        `)
        .eq('status', 'concluido')
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'));

      // Calcular receita total dos serviços
      const receitaTotal = agendamentos?.reduce((sum, agendamento) => 
        sum + Number(agendamento.painel_servicos?.preco || 0), 0) || 0;

      // Buscar comissões do período
      const { data: comissoes } = await supabase
        .from('barber_commissions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const comissaoTotal = comissoes?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      const comissaoPendente = comissoes?.filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      // Buscar despesas do fluxo de caixa
      const { data: despesas } = await supabase
        .from('cash_flow')
        .select('amount')
        .eq('transaction_type', 'expense')
        .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

      const despesasCaixa = despesas?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const despesaTotal = despesasCaixa + comissaoTotal;
      const lucroLiquido = receitaTotal - despesaTotal;
      const margem = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

      return {
        receitaTotal,
        despesaTotal,
        comissaoTotal,
        comissaoPendente,
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
      title: 'Despesas + Comissões',
      value: `R$ ${summary?.despesaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Comissões Pendentes',
      value: `R$ ${summary?.comissaoPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: Calculator,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
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
      <FiltrosFinanceiros 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
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
                <p className={`text-xs ${summary.margem >= 20 ? 'text-green-600' : 'text-red-600'}`}>
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
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 border border-gray-200">
          <TabsTrigger 
            value="caixa" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
          >
            Caixa
          </TabsTrigger>
          <TabsTrigger 
            value="transacoes"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
          >
            Transações
          </TabsTrigger>
          <TabsTrigger 
            value="comissoes"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
          >
            Comissões
          </TabsTrigger>
          <TabsTrigger 
            value="relatorios"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-urbana-gold data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-700"
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
