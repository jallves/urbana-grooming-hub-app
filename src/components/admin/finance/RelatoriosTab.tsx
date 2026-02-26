
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, BarChart3, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

interface RelatoriosTabProps {
  filters: {
    mes: number;
    ano: number;
    tipo: string;
    barbeiro: string;
  };
}

interface Commission {
  id: string;
  amount: number;
  commission_rate: number;
  status: 'pending' | 'paid';
  created_at: string;
  payment_date?: string;
  paid_at?: string;
  payment_method?: string;
  notes?: string;
  appointment_id: string;
  barber_id: string;
  staff?: { name: string };
  appointment_source?: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];

const RelatoriosTab: React.FC<RelatoriosTabProps> = ({ filters }) => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['chart-data', filters],
    queryFn: async () => {
      // Dados dos últimos 6 meses
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(filters.ano, filters.mes - 1 - i, 1);
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Receitas dos agendamentos concluídos
        const { data: agendamentos } = await supabase
          .from('painel_agendamentos')
          .select(`
            painel_servicos!inner(preco)
          `)
          .eq('status', 'concluido')
          .gte('data', format(startDate, 'yyyy-MM-dd'))
          .lte('data', format(endDate, 'yyyy-MM-dd'));

        const receitas = agendamentos?.reduce((sum, a) => 
          sum + Number(a.painel_servicos?.preco || 0), 0) || 0;

        // Despesas do fluxo de caixa + comissões pagas
        const { data: despesasCaixa } = await supabase
          .from('cash_flow')
          .select('amount')
          .eq('transaction_type', 'expense')
          .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
          .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

        const { data: comissoesPagas } = await supabase
          .from('barber_commissions')
          .select('amount')
          .eq('status', 'paid')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        const despesasCaixaTotal = despesasCaixa?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        const comissoesTotal = comissoesPagas?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const despesas = despesasCaixaTotal + comissoesTotal;

        months.push({
          month: format(date, 'MMM', { locale: ptBR }),
          receitas,
          despesas,
          lucro: receitas - despesas
        });
      }

      return months;
    }
  });

  const { data: categoryData } = useQuery({
    queryKey: ['category-data', filters],
    queryFn: async () => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      // Categorias de despesas
      const { data: despesas } = await supabase
        .from('cash_flow')
        .select('category, amount')
        .eq('transaction_type', 'expense')
        .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

      // Comissões como categoria
      const { data: comissoes } = await supabase
        .from('barber_commissions')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const categories = despesas?.reduce((acc, despesa) => {
        const key = despesa.category;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += Number(despesa.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      // Adicionar comissões
      const comissaoTotal = comissoes?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      if (comissaoTotal > 0) {
        categories['Comissões'] = comissaoTotal;
      }

      return Object.entries(categories).map(([name, value]) => ({
        name,
        value
      }));
    }
  });

  const { data: exportData } = useQuery({
    queryKey: ['export-data', filters],
    queryFn: async () => {
      const startDate = new Date(filters.ano, filters.mes - 1, 1);
      const endDate = new Date(filters.ano, filters.mes, 0);

      // Receitas dos agendamentos
      const { data: agendamentos } = await supabase
        .from('painel_agendamentos')
        .select(`
          data,
          painel_servicos!inner(nome, preco),
          painel_barbeiros!inner(nome)
        `)
        .eq('status', 'concluido')
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'));

      // Despesas do fluxo de caixa
      const { data: despesas } = await supabase
        .from('cash_flow')
        .select('*')
        .eq('transaction_type', 'expense')
        .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

      // Comissões com cast explícito
      const { data: comissoesData } = await supabase
        .from('barber_commissions')
        .select(`
          *,
          painel_barbeiros:barber_id(nome)
        `)
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const comissoes = (comissoesData || []).map(c => ({
        ...c,
        staff: (c as any).painel_barbeiros ? { name: (c as any).painel_barbeiros.nome } : null
      })) as Commission[];

      const exportData = [];

      // Adicionar receitas
      agendamentos?.forEach(agendamento => {
        exportData.push({
          Data: format(parseISO(agendamento.data), 'dd/MM/yyyy'),
          Tipo: 'Receita',
          Categoria: 'Serviços',
          Descrição: agendamento.painel_servicos?.nome,
          Valor: Number(agendamento.painel_servicos?.preco || 0),
          Barbeiro: agendamento.painel_barbeiros?.nome,
          'Forma de Pagamento': '',
          Observações: ''
        });
      });

      // Adicionar despesas
      despesas?.forEach(despesa => {
        exportData.push({
          Data: format(new Date(despesa.transaction_date), 'dd/MM/yyyy'),
          Tipo: 'Despesa',
          Categoria: despesa.category,
          Descrição: despesa.description,
          Valor: Number(despesa.amount),
          Barbeiro: '',
          'Forma de Pagamento': despesa.payment_method || '',
          Observações: despesa.notes || ''
        });
      });

      // Adicionar comissões com verificação de propriedades opcionais
      comissoes?.forEach(comissao => {
        const paidDate = comissao.paid_at || comissao.created_at;
        exportData.push({
          Data: format(new Date(paidDate), 'dd/MM/yyyy'),
          Tipo: 'Despesa',
          Categoria: 'Comissões',
          Descrição: `Comissão - ${comissao.staff?.name}`,
          Valor: Number(comissao.amount),
          Barbeiro: comissao.staff?.name,
          'Forma de Pagamento': comissao.payment_method || '',
          Observações: comissao.notes || ''
        });
      });

      return exportData.sort((a, b) => new Date(b.Data.split('/').reverse().join('-')).getTime() - new Date(a.Data.split('/').reverse().join('-')).getTime());
    }
  });

  const exportToExcel = () => {
    if (!exportData) return;

    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo do Período
    const totals = exportData.reduce((acc, row) => {
      if (row.Tipo === 'Receita') acc.receita += row.Valor;
      else acc.despesa += row.Valor;
      return acc;
    }, { receita: 0, despesa: 0 });

    const summarySheet = [
      ['RELATÓRIO FINANCEIRO MENSAL'],
      ['Mês/Ano:', `${filters.mes}/${filters.ano}`],
      ['Gerado em:', format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })],
      [''],
      ['RESUMO DO PERÍODO'],
      ['Receita Total:', totals.receita],
      ['Despesa Total:', totals.despesa],
      ['Lucro Líquido:', totals.receita - totals.despesa],
      ['Margem:', totals.receita > 0 ? `${(((totals.receita - totals.despesa) / totals.receita) * 100).toFixed(1)}%` : '0%'],
      ['Total de Transações:', exportData.length],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheet);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

    // Aba 2: Todas as Transações
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');

    // Aba 3: Por Barbeiro
    const byBarber: Record<string, { receita: number; comissao: number; servicos: number }> = {};
    exportData.forEach(row => {
      const barber = row.Barbeiro || 'Sem barbeiro';
      if (!byBarber[barber]) byBarber[barber] = { receita: 0, comissao: 0, servicos: 0 };
      if (row.Tipo === 'Receita' && row.Categoria === 'Serviços') {
        byBarber[barber].receita += row.Valor;
        byBarber[barber].servicos++;
      }
      if (row.Categoria === 'Comissões') {
        byBarber[barber].comissao += row.Valor;
      }
    });
    const barberSheet = [
      ['RELATÓRIO POR BARBEIRO'],
      [''],
      ['Barbeiro', 'Receita Gerada (R$)', 'Comissão (R$)', 'Serviços', 'Ticket Médio (R$)', '% Comissão'],
      ...Object.entries(byBarber)
        .filter(([name]) => name !== 'Sem barbeiro')
        .sort((a, b) => b[1].receita - a[1].receita)
        .map(([name, d]) => [
          name, d.receita, d.comissao, d.servicos,
          d.servicos > 0 ? d.receita / d.servicos : 0,
          d.receita > 0 ? `${((d.comissao / d.receita) * 100).toFixed(1)}%` : '0%',
        ]),
    ];
    const wsBarber = XLSX.utils.aoa_to_sheet(barberSheet);
    wsBarber['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsBarber, 'Por Barbeiro');

    // Aba 4: Por Categoria
    const byCat: Record<string, { receita: number; despesa: number; count: number }> = {};
    exportData.forEach(row => {
      const cat = row.Categoria || 'Outros';
      if (!byCat[cat]) byCat[cat] = { receita: 0, despesa: 0, count: 0 };
      if (row.Tipo === 'Receita') byCat[cat].receita += row.Valor;
      else byCat[cat].despesa += row.Valor;
      byCat[cat].count++;
    });
    const catSheet = [
      ['ANÁLISE POR CATEGORIA'],
      [''],
      ['Categoria', 'Receita (R$)', 'Despesa (R$)', 'Saldo (R$)', 'Transações'],
      ...Object.entries(byCat).sort((a, b) => (b[1].receita + b[1].despesa) - (a[1].receita + a[1].despesa)).map(([cat, d]) => [
        cat, d.receita, d.despesa, d.receita - d.despesa, d.count,
      ]),
    ];
    const wsCat = XLSX.utils.aoa_to_sheet(catSheet);
    wsCat['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Por Categoria');

    // Aba 5: Por Forma de Pagamento
    const byPayment: Record<string, { total: number; count: number }> = {};
    exportData.forEach(row => {
      const method = row['Forma de Pagamento'] || 'Não informado';
      if (!byPayment[method]) byPayment[method] = { total: 0, count: 0 };
      byPayment[method].total += row.Valor;
      byPayment[method].count++;
    });
    const paySheet = [
      ['ANÁLISE POR FORMA DE PAGAMENTO'],
      [''],
      ['Forma de Pagamento', 'Valor Total (R$)', 'Transações', '% do Total'],
      ...Object.entries(byPayment).sort((a, b) => b[1].total - a[1].total).map(([method, d]) => {
        const totalVal = Object.values(byPayment).reduce((s, x) => s + x.total, 0);
        return [method, d.total, d.count, totalVal > 0 ? `${((d.total / totalVal) * 100).toFixed(1)}%` : '0%'];
      }),
    ];
    const wsPay = XLSX.utils.aoa_to_sheet(paySheet);
    wsPay['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsPay, 'Formas de Pagamento');

    const fileName = `relatorio_financeiro_${filters.mes}_${filters.ano}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão de Exportar */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Exportar Relatórios
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">
            Exporte todas as transações do período selecionado incluindo receitas automáticas dos agendamentos, despesas manuais e comissões pagas.
          </p>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Evolução Mensal (Últimos 6 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, undefined]}
                />
                <Line 
                  type="monotone" 
                  dataKey="receitas" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Receitas"
                />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Despesas"
                />
                <Line 
                  type="monotone" 
                  dataKey="lucro" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Lucro"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Categorias de Despesas */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Distribuição de Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, undefined]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosTab;
