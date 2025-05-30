
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ClientReports: React.FC = () => {
  // Fetch clients and appointments data
  const { data: clientData, isLoading } = useQuery({
    queryKey: ['client-reports'],
    queryFn: async () => {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at');
      
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*, client_id, services(price)')
        .eq('status', 'completed');
      
      if (clientsError || appointmentsError) {
        throw new Error(clientsError?.message || appointmentsError?.message);
      }
      
      return { clients, appointments };
    }
  });

  // Process monthly client registration data
  const monthlyRegistrations = React.useMemo(() => {
    if (!clientData?.clients) return [];
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const monthlyStats = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthClients = clientData.clients.filter(client => {
        const clientMonth = new Date(client.created_at).getMonth();
        return clientMonth === monthIndex;
      });
      
      monthlyStats.push({
        month: months[monthIndex],
        newClients: monthClients.length,
        // Calculate returning clients (clients with multiple appointments)
        returningClients: monthClients.filter(client => {
          const clientAppointments = clientData.appointments?.filter(apt => apt.client_id === client.id) || [];
          return clientAppointments.length > 1;
        }).length
      });
    }
    
    return monthlyStats;
  }, [clientData]);

  // Process client frequency data
  const clientFrequency = React.useMemo(() => {
    if (!clientData?.clients || !clientData?.appointments) return [];
    
    const frequencyStats = {
      'Primeira vez': 0,
      '2-3 visitas': 0,
      '4-6 visitas': 0,
      '7+ visitas': 0
    };
    
    clientData.clients.forEach(client => {
      const appointmentCount = clientData.appointments.filter(apt => apt.client_id === client.id).length;
      
      if (appointmentCount === 1) {
        frequencyStats['Primeira vez']++;
      } else if (appointmentCount <= 3) {
        frequencyStats['2-3 visitas']++;
      } else if (appointmentCount <= 6) {
        frequencyStats['4-6 visitas']++;
      } else {
        frequencyStats['7+ visitas']++;
      }
    });
    
    return Object.entries(frequencyStats).map(([frequency, count]) => ({
      name: frequency,
      value: count
    }));
  }, [clientData]);

  // Calculate top clients by revenue
  const topClients = React.useMemo(() => {
    if (!clientData?.clients || !clientData?.appointments) return [];
    
    const clientRevenue = {};
    
    clientData.appointments.forEach(appointment => {
      const clientId = appointment.client_id;
      const revenue = Number(appointment.services?.price) || 0;
      
      if (!clientRevenue[clientId]) {
        const client = clientData.clients.find(c => c.id === clientId);
        clientRevenue[clientId] = {
          name: client?.name || 'Cliente Desconhecido',
          revenue: 0,
          appointments: 0
        };
      }
      
      clientRevenue[clientId].revenue += revenue;
      clientRevenue[clientId].appointments++;
    });
    
    return Object.values(clientRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [clientData]);

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!clientData?.clients || !clientData?.appointments) return {};
    
    const totalClients = clientData.clients.length;
    const totalRevenue = clientData.appointments.reduce((sum, apt) => {
      return sum + Number(apt.services?.price || 0);
    }, 0);
    
    const averageRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
    
    // Calculate retention rate (clients with more than 1 appointment)
    const returningClients = clientData.clients.filter(client => {
      const appointmentCount = clientData.appointments.filter(apt => apt.client_id === client.id).length;
      return appointmentCount > 1;
    }).length;
    
    const retentionRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0;
    
    // New clients this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newClientsThisMonth = clientData.clients.filter(client => {
      const clientDate = new Date(client.created_at);
      return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
    }).length;
    
    return {
      totalClients,
      averageRevenuePerClient,
      retentionRate,
      newClientsThisMonth
    };
  }, [clientData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{summaryMetrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">Total de Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{summaryMetrics.newClientsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Novos Clientes (Este Mês)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{summaryMetrics.retentionRate}%</div>
            <p className="text-xs text-muted-foreground">Taxa de Retenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              R$ {summaryMetrics.averageRevenuePerClient?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Receita Média por Cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Client Registration */}
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Clientes</CardTitle>
          <CardDescription>
            Novos clientes vs clientes que retornaram nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newClients" name="Novos Clientes" fill="#4ade80" />
                <Bar dataKey="returningClients" name="Clientes Recorrentes" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Frequência de Clientes</CardTitle>
            <CardDescription>
              Distribuição de clientes por número de visitas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientFrequency}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {clientFrequency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes por Receita</CardTitle>
            <CardDescription>
              Clientes que mais geraram receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topClients.length > 0 ? (
              <div className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.appointments} agendamento{client.appointments !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        R$ {client.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de cliente encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientReports;
