
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface ClientStatistics {
  name: string;
  appointments: number;
  revenue: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

const ClientReports: React.FC = () => {
  // Fetch clients data with appointments
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['client-reports'],
    queryFn: async () => {
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients(name, email, phone),
          services(price)
        `)
        .eq('status', 'completed')
        .gte('start_time', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (appointmentsError) throw appointmentsError;

      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (clientsError) throw clientsError;
      
      return { appointments: appointments || [], clients: clients || [] };
    }
  });

  // Process monthly new clients
  const monthlyNewClients = React.useMemo(() => {
    if (!clientsData?.clients) return [];
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const monthlyStats = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthClients = clientsData.clients.filter(client => {
        const clientMonth = new Date(client.created_at).getMonth();
        return clientMonth === monthIndex;
      });
      
      monthlyStats.push({
        month: months[monthIndex],
        newClients: monthClients.length,
        total: monthClients.length
      });
    }
    
    return monthlyStats;
  }, [clientsData?.clients]);

  // Process monthly revenue
  const monthlyRevenue = React.useMemo((): MonthlyRevenueData[] => {
    if (!clientsData?.appointments) return [];
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const revenueStats: MonthlyRevenueData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthAppointments = clientsData.appointments.filter(apt => {
        const aptMonth = new Date(apt.start_time).getMonth();
        return aptMonth === monthIndex;
      });
      
      const revenue = monthAppointments.reduce((total: number, apt) => {
        return total + (Number(apt.services?.price) || 0);
      }, 0);
      
      revenueStats.push({
        month: months[monthIndex],
        revenue: revenue
      });
    }
    
    return revenueStats;
  }, [clientsData?.appointments]);

  // Process top clients
  const topClients = React.useMemo((): ClientStatistics[] => {
    if (!clientsData?.appointments) return [];
    
    const clientStats: Record<string, { appointments: number; revenue: number }> = {};
    
    clientsData.appointments.forEach(apt => {
      const clientName = apt.clients?.name || 'Cliente Desconhecido';
      const revenue = Number(apt.services?.price) || 0;
      
      if (!clientStats[clientName]) {
        clientStats[clientName] = { appointments: 0, revenue: 0 };
      }
      
      clientStats[clientName].appointments++;
      clientStats[clientName].revenue += revenue;
    });
    
    return Object.entries(clientStats)
      .map(([name, stats]) => ({
        name,
        appointments: stats.appointments,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [clientsData?.appointments]);

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!clientsData) return {};
    
    const totalClients = clientsData.clients.length;
    const totalRevenue = clientsData.appointments.reduce((total, apt) => {
      return total + (Number(apt.services?.price) || 0);
    }, 0);
    
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthStart = new Date(thisYear, thisMonth, 1);
    
    const newClientsThisMonth = clientsData.clients.filter(client => {
      const clientDate = new Date(client.created_at);
      return clientDate >= monthStart;
    }).length;
    
    const avgRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;
    
    return {
      totalClients,
      totalRevenue,
      newClientsThisMonth,
      avgRevenuePerClient
    };
  }, [clientsData]);

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
            <div className="text-2xl font-bold text-green-600">
              R$ {Number(summaryMetrics.totalRevenue).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Receita Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{summaryMetrics.newClientsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Novos Este Mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              R$ {Number(summaryMetrics.avgRevenuePerClient).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Receita Média por Cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly New Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Novos Clientes por Mês</CardTitle>
            <CardDescription>
              Crescimento da base de clientes nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyNewClients}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="newClients" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Novos Clientes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Mês</CardTitle>
            <CardDescription>
              Receita gerada nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Clientes</CardTitle>
          <CardDescription>
            Clientes com maior receita gerada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topClients.length > 0 ? (
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.appointments} agendamento{client.appointments !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {client.revenue.toLocaleString('pt-BR')}
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
  );
};

export default ClientReports;
