
import React, { useState } from 'react';
import { format } from 'date-fns'; 
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MarketingCampaign } from '@/types/marketing';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const MarketingReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Fetch marketing campaigns
  const { data: campaignData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['marketing-campaigns-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      // Transform data to include revenue and cost (mock data for now)
      return data.map((campaign: MarketingCampaign) => ({
        ...campaign,
        revenue: Math.floor(Math.random() * 10000) + 2000, // Mock revenue data
        cost: Math.floor(Math.random() * 2000) + 500,      // Mock cost data
        conversionRate: (Math.random() * 10 + 5).toFixed(1) // Mock conversion rate
      }));
    },
  });

  // Fetch coupon usage data
  const { data: couponData, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ['coupons-usage-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      // Group by month and calculate usage
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyData = months.slice(0, 6).map(month => ({
        month,
        used: Math.floor(Math.random() * 20) + 20,    // Mock used count for now
        created: Math.floor(Math.random() * 15) + 25  // Mock created count for now
      }));
      
      return monthlyData;
    }
  });

  // Mock channel data - in a real application, this would come from analytics
  const channelData = [
    { name: 'Instagram', value: 40 },
    { name: 'Facebook', value: 25 },
    { name: 'Google', value: 20 },
    { name: 'Email', value: 10 },
    { name: 'Indicações', value: 5 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Desempenho de Campanhas</CardTitle>
          <CardDescription>
            Comparação de ROI e eficácia das campanhas de marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCampaigns ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Campanha</th>
                    <th className="text-left py-3 px-2">Receita</th>
                    <th className="text-left py-3 px-2">Custo</th>
                    <th className="text-left py-3 px-2">ROI</th>
                    <th className="text-left py-3 px-2">Taxa de Conversão</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignData?.map((campaign, index) => {
                    const roi = ((campaign.revenue - campaign.cost) / campaign.cost * 100).toFixed(2);
                    return (
                      <tr key={campaign.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{campaign.name}</td>
                        <td className="py-3 px-2">R$ {campaign.revenue.toLocaleString()}</td>
                        <td className="py-3 px-2">R$ {campaign.cost.toLocaleString()}</td>
                        <td className="py-3 px-2 font-bold">
                          {roi}%
                        </td>
                        <td className="py-3 px-2">{campaign.conversionRate}%</td>
                        <td className="py-3 px-2">
                          <Badge variant={Number(roi) > 300 ? "success" : "default"}>
                            {Number(roi) > 300 ? "Excelente" : "Bom"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fontes de Tráfego</CardTitle>
            <CardDescription>
              Distribuição dos canais de aquisição de clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Porcentagem']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilização de Cupons</CardTitle>
            <CardDescription>
              Comparação entre cupons criados e utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCoupons ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={couponData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="created" name="Cupons Criados" fill="#8884d8" />
                    <Bar dataKey="used" name="Cupons Utilizados" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Métricas de Marketing</CardTitle>
          <CardDescription>
            Principais indicadores de desempenho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Custo de Aquisição de Cliente (CAC)</div>
              <div className="text-2xl font-bold">R$ 38,50</div>
              <div className="text-xs text-green-600 mt-1">▼ 12% em relação ao mês anterior</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Valor Médio por Cliente</div>
              <div className="text-2xl font-bold">R$ 182,75</div>
              <div className="text-xs text-green-600 mt-1">▲ 7% em relação ao mês anterior</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Taxa de Retenção</div>
              <div className="text-2xl font-bold">68%</div>
              <div className="text-xs text-green-600 mt-1">▲ 5% em relação ao mês anterior</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingReports;
