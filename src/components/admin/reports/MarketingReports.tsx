
import React from 'react';
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

const mockCampaignData = [
  { name: 'Promoção de Verão', revenue: 5200, cost: 1200, conversionRate: 8.3 },
  { name: 'Dia dos Pais', revenue: 3800, cost: 900, conversionRate: 7.2 },
  { name: 'Black Friday', revenue: 7500, cost: 1800, conversionRate: 9.5 },
  { name: 'Natal', revenue: 6300, cost: 1500, conversionRate: 8.7 },
];

const mockChannelData = [
  { name: 'Instagram', value: 40 },
  { name: 'Facebook', value: 25 },
  { name: 'Google', value: 20 },
  { name: 'Email', value: 10 },
  { name: 'Indicações', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const mockCouponData = [
  { month: 'Jan', used: 22, created: 30 },
  { month: 'Fev', used: 28, created: 35 },
  { month: 'Mar', used: 32, created: 40 },
  { month: 'Abr', used: 35, created: 42 },
  { month: 'Mai', used: 30, created: 38 },
  { month: 'Jun', used: 40, created: 45 },
];

const MarketingReports: React.FC = () => {
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
                {mockCampaignData.map((campaign, index) => {
                  const roi = ((campaign.revenue - campaign.cost) / campaign.cost * 100).toFixed(2);
                  return (
                    <tr key={index} className="border-b hover:bg-muted/50">
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
                    data={mockChannelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockChannelData.map((entry, index) => (
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockCouponData}
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
