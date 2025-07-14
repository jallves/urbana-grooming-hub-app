import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#4ade80', '#22c55e', '#fde68a', '#f87171', '#a78bfa']; // Tons verdes, amarelos e vermelho suave para dark

const FinanceReports: React.FC = () => {
  // ...seu código de fetch permanece igual...

  if (isLoadingMonthly || isLoadingServices || isLoadingSummary) {
    return (
      <div className="flex items-center justify-center py-10 bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 p-4 min-h-screen text-white">
      <Card className="w-full bg-gray-800 border border-gray-700 shadow-none">
        <CardHeader>
          <CardTitle>Receitas vs Despesas</CardTitle>
          <CardDescription>
            Comparação de receitas e despesas dos últimos 6 meses (dados reais)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid stroke="#444" strokeDasharray="3 3" /> {/* Linhas em cinza escuro */}
                <XAxis dataKey="month" stroke="#bbb" /> {/* Eixo em cinza claro */}
                <YAxis stroke="#bbb" />
                <Tooltip
                  wrapperStyle={{ backgroundColor: '#1f2937', borderRadius: 4, border: 'none' }} // Fundo escuro tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderRadius: 4 }}
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, undefined]}
                  labelFormatter={(label) => `Mês: ${label}`}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend wrapperStyle={{ color: 'white' }} />
                <Bar dataKey="income" name="Receitas" fill="#4ade80" />
                <Bar dataKey="expense" name="Despesas" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border border-gray-700 shadow-none">
          <CardHeader>
            <CardTitle>Distribuição por Serviços</CardTitle>
            <CardDescription>
              Porcentagem de receita por tipo de serviço (dados reais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serviceData && serviceData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      wrapperStyle={{ backgroundColor: '#1f2937', borderRadius: 4, border: 'none' }}
                      contentStyle={{ backgroundColor: '#1f2937', borderRadius: 4 }}
                      formatter={(value) => [`${value}%`, undefined]}
                      labelStyle={{ color: 'white' }}
                      itemStyle={{ color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Nenhum agendamento concluído encontrado para análise.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border border-gray-700 shadow-none">
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>
              Resumo das métricas financeiras do mês atual (dados reais)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: 'Total Receitas (Mês Atual)', value: financialSummary?.totalIncome, color: 'text-green-500' },
                { label: 'Total Despesas (Mês Atual)', value: financialSummary?.totalExpense, color: 'text-red-500' },
                { 
                  label: 'Lucro (Mês Atual)', 
                  value: financialSummary?.profit, 
                  color: financialSummary?.profit >= 0 ? 'text-blue-500' : 'text-red-500' 
                },
                { label: 'Margem de Lucro', value: financialSummary?.profitMargin, isPercent: true },
                { label: 'Ticket Médio', value: financialSummary?.averageTicket }
              ].map(({ label, value, color, isPercent }, i) => (
                <div key={i} className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span className={`text-lg font-bold ${color ?? 'text-white'}`}>
                    {value !== undefined && value !== null ? (
                      isPercent ? `${value.toFixed(1)}%` : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    ) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceReports;
