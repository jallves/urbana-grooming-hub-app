
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const mockClientGrowthData = [
  { month: 'Jan', clients: 120 },
  { month: 'Fev', clients: 142 },
  { month: 'Mar', clients: 158 },
  { month: 'Abr', clients: 170 },
  { month: 'Mai', clients: 190 },
  { month: 'Jun', clients: 215 },
];

const mockAgeDistribution = [
  { name: '18-24', value: 15 },
  { name: '25-34', value: 30 },
  { name: '35-44', value: 25 },
  { name: '45-54', value: 20 },
  { name: '55+', value: 10 },
];

const mockFrequencyData = [
  { name: 'Semanal', value: 10 },
  { name: 'Quinzenal', value: 25 },
  { name: 'Mensal', value: 40 },
  { name: 'Trimestral', value: 15 },
  { name: 'Esporádico', value: 10 },
];

const mockServicePreferenceData = [
  { service: 'Cortes', count: 180 },
  { service: 'Barba', count: 120 },
  { service: 'Cabelo + Barba', count: 90 },
  { service: 'Tratamentos', count: 50 },
  { service: 'Coloração', count: 30 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ClientReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Crescimento da Base de Clientes</CardTitle>
          <CardDescription>
            Evolução do número de clientes nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mockClientGrowthData}
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
                <Area 
                  type="monotone" 
                  dataKey="clients" 
                  name="Total de Clientes" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Idade</CardTitle>
            <CardDescription>
              Perfil demográfico dos clientes por faixa etária
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockAgeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockAgeDistribution.map((entry, index) => (
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
            <CardTitle>Frequência de Visitas</CardTitle>
            <CardDescription>
              Regularidade com que os clientes utilizam os serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockFrequencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockFrequencyData.map((entry, index) => (
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferências de Serviços</CardTitle>
          <CardDescription>
            Serviços mais utilizados pelos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockServicePreferenceData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="service" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Quantidade" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métricas de Clientes</CardTitle>
          <CardDescription>
            Principais indicadores sobre a base de clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Novos Clientes (Mês)</div>
              <div className="text-2xl font-bold">25</div>
              <div className="text-xs text-green-600 mt-1">▲ 15% em relação ao mês anterior</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Taxa de Retenção</div>
              <div className="text-2xl font-bold">78%</div>
              <div className="text-xs text-green-600 mt-1">▲ 3% em relação ao mês anterior</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Valor por Cliente (LTV)</div>
              <div className="text-2xl font-bold">R$ 2.450</div>
              <div className="text-xs text-green-600 mt-1">▲ 5% em relação ao mês anterior</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientReports;
