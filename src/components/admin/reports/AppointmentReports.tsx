
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
  Bar
} from 'recharts';

const mockMonthlyData = [
  { month: 'Jan', appointments: 45 },
  { month: 'Fev', appointments: 52 },
  { month: 'Mar', appointments: 48 },
  { month: 'Abr', appointments: 61 },
  { month: 'Mai', appointments: 58 },
  { month: 'Jun', appointments: 65 },
];

const mockServiceTypeData = [
  { name: 'Cortes', value: 120 },
  { name: 'Barba', value: 80 },
  { name: 'Cabelo + Barba', value: 70 },
  { name: 'Tratamentos', value: 30 },
  { name: 'Coloração', value: 20 },
];

const mockDailyData = [
  { day: 'Seg', morning: 8, afternoon: 6 },
  { day: 'Ter', morning: 7, afternoon: 8 },
  { day: 'Qua', morning: 9, afternoon: 7 },
  { day: 'Qui', morning: 8, afternoon: 9 },
  { day: 'Sex', morning: 10, afternoon: 12 },
  { day: 'Sab', morning: 15, afternoon: 14 },
];

const AppointmentReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agendamentos por Mês</CardTitle>
          <CardDescription>
            Total de agendamentos nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mockMonthlyData}
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
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  name="Agendamentos" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Turno</CardTitle>
            <CardDescription>
              Distribuição de agendamentos por turno em cada dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockDailyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="morning" name="Manhã" fill="#8884d8" />
                  <Bar dataKey="afternoon" name="Tarde" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Agendamentos</CardTitle>
            <CardDescription>
              Resumo e métricas de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Total de Agendamentos (Mês)</span>
                <span className="text-lg font-bold">65</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Taxa de Comparecimento</span>
                <span className="text-lg font-bold text-green-600">92%</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Taxa de Cancelamento</span>
                <span className="text-lg font-bold text-amber-600">5%</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">No-shows</span>
                <span className="text-lg font-bold text-red-600">3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Recorrência de Clientes</span>
                <span className="text-lg font-bold">68%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agendamentos por Tipo de Serviço</CardTitle>
          <CardDescription>
            Distribuição dos serviços mais agendados no último mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockServiceTypeData}
                layout="vertical"
                margin={{
                  top: 20,
                  right: 30,
                  left: 60,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Quantidade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentReports;
